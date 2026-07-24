import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppLinkButton } from "../../../components/common/AppLinkButton";
import { AppScreen } from "../../../components/common/AppScreen";
import { theme } from "../../../lib/constants/theme";
import { SignOutButton } from "../../auth/components/SignOutButton";
import { READINESS_DISCLAIMER } from "../readiness";
import type { ExamProgress, TopicProgress } from "../schemas";
import { useProgressDashboard, useProgressStudents } from "../hooks/useProgress";

type ProgressDashboardProps = {
  audience: "guardian" | "student";
  compact?: boolean;
};

export function ProgressDashboard({ audience, compact = false }: ProgressDashboardProps) {
  const students = useProgressStudents();
  const [selectedStudentOverride, setSelectedStudentId] = useState<string>();
  const selectedStudentId = selectedStudentOverride ?? students.data?.[0]?.student_id;
  const dashboard = useProgressDashboard(selectedStudentId);

  const title = compact
    ? "Student dashboard"
    : audience === "guardian"
      ? "Family progress"
      : "Progress and readiness";
  const description =
    audience === "guardian"
      ? "Supportive progress for students who are actively linked to your account."
      : "See what is improving, what needs review, and the best next study action.";

  return (
    <AppScreen
      actions={
        audience === "guardian" ? (
          <View style={styles.studentTabs}>
            <AppLinkButton href="/family-challenge" label="Family challenge" variant="secondary" />
            <SignOutButton />
          </View>
        ) : compact ? (
          <SignOutButton />
        ) : undefined
      }
      description={description}
      eyebrow={audience === "guardian" ? "Parent or coach" : "Student"}
      title={title}
    >
      {students.isPending ? (
        <LoadingCard label="Loading progress access…" />
      ) : students.isError ? (
        <AppCard title="Progress unavailable" description="Check the connection and try again.">
          <AppButton label="Try again" onPress={() => void students.refetch()} />
        </AppCard>
      ) : !students.data.length ? (
        <AppCard
          title={audience === "guardian" ? "No linked students" : "Student access unavailable"}
          description={
            audience === "guardian"
              ? "An administrator must create an active link with progress access before student information appears."
              : "Your account needs an active student role before progress can be shown."
          }
        />
      ) : (
        <>
          {students.data.length > 1 || audience === "guardian" ? (
            <View accessibilityRole="tablist" style={styles.studentTabs}>
              {students.data.map((student) => {
                const selected = student.student_id === selectedStudentId;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={student.student_id}
                    onPress={() => setSelectedStudentId(student.student_id)}
                    style={[styles.studentTab, selected && styles.studentTabSelected]}
                  >
                    <Text
                      style={[styles.studentTabText, selected && styles.studentTabTextSelected]}
                    >
                      {student.display_name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {dashboard.isPending ? (
            <LoadingCard label="Calculating current progress…" />
          ) : dashboard.isError ? (
            <AppCard title="Progress unavailable" description="The progress request failed safely.">
              <AppButton label="Try again" onPress={() => void dashboard.refetch()} />
            </AppCard>
          ) : !dashboard.data?.length ? (
            <AppCard
              title="No assigned study bank"
              description="Progress will appear after eligible questions are assigned."
            />
          ) : (
            dashboard.data.map((exam) => (
              <ExamProgressSection compact={compact} exam={exam} key={exam.exam_id} />
            ))
          )}
        </>
      )}
    </AppScreen>
  );
}

function ExamProgressSection({ compact, exam }: { compact: boolean; exam: ExamProgress }) {
  return (
    <View style={styles.section}>
      <AppCard title={exam.exam_title} description={READINESS_DISCLAIMER}>
        <View style={styles.readinessRow}>
          <View
            accessible
            accessibilityLabel={`Readiness ${Math.round(exam.readiness_score)} percent`}
          >
            <Text style={styles.readinessScore}>{Math.round(exam.readiness_score)}%</Text>
            <Text style={styles.readinessLabel}>{exam.readiness_label}</Text>
          </View>
          <View style={styles.metrics}>
            <Metric
              label="Coverage"
              value={`${exam.attempted_question_count} of ${exam.eligible_question_count}`}
            />
            <Metric label="Recent accuracy" value={`${Math.round(exam.recent_accuracy_score)}%`} />
            <Metric label="Mastery" value={`${Math.round(exam.mastery_score)}%`} />
            <Metric label="Retention" value={`${Math.round(exam.retention_score)}%`} />
          </View>
        </View>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            High readiness requires broad question coverage. This estimate cannot guarantee an exam
            result.
          </Text>
        </View>
      </AppCard>

      <AppCard title="Recommended next step">
        <Text style={styles.action}>{exam.recommended_action}</Text>
        {exam.recommended_topic_title ? (
          <Text style={styles.muted}>Focus area: {exam.recommended_topic_title}</Text>
        ) : null}
        {exam.due_question_count > 0 ? (
          <Text style={styles.due}>{exam.due_question_count} due for review</Text>
        ) : null}
      </AppCard>

      {!compact ? (
        <>
          <TopicProgressList topics={exam.topics} />
          <TrendCard trends={exam.trends} />
        </>
      ) : null}
    </View>
  );
}

function TopicProgressList({ topics }: { topics: TopicProgress[] }) {
  const [expandedId, setExpandedId] = useState<string>();
  return (
    <AppCard
      title="Topic detail"
      description="Open a topic for coverage, confidence, and review timing."
    >
      {topics.map((topic) => {
        const expanded = expandedId === topic.topic_id;
        return (
          <View key={topic.topic_id} style={styles.topicRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setExpandedId(expanded ? undefined : topic.topic_id)}
              style={styles.topicButton}
            >
              <View style={styles.topicTitleRow}>
                <Text style={styles.topicTitle}>{topic.topic_title}</Text>
                {topic.recommended ? <Text style={styles.reviewBadge}>Review</Text> : null}
              </View>
              <Text style={styles.muted}>
                {formatStatus(topic.status)} · Mastery {Math.round(topic.mastery_score)}% · Accuracy{" "}
                {Math.round(topic.accuracy_score)}%
              </Text>
            </Pressable>
            {expanded ? (
              <View style={styles.topicDetails}>
                <Metric
                  label="Question coverage"
                  value={`${topic.attempted_question_count} of ${topic.eligible_question_count}`}
                />
                <Metric label="Confidence" value={`${Math.round(topic.confidence_score)}%`} />
                <Metric label="Retention" value={`${Math.round(topic.retention_score)}%`} />
                <Metric label="Due now" value={String(topic.due_question_count)} />
                <Text style={styles.smallText}>
                  Last practiced: {formatDate(topic.last_practiced_at)} · Next review:{" "}
                  {formatDate(topic.next_review_at)}
                </Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </AppCard>
  );
}

function TrendCard({ trends }: { trends: ExamProgress["trends"] }) {
  return (
    <AppCard title="30-day trend" description="Daily accuracy for days with answered questions.">
      {!trends.length ? (
        <Text style={styles.muted}>Complete a study session to begin a trend.</Text>
      ) : (
        trends.map((trend) => (
          <View key={trend.trend_date} style={styles.trendRow}>
            <View style={styles.trendLabels}>
              <Text style={styles.trendDate}>{formatShortDate(trend.trend_date)}</Text>
              <Text style={styles.muted}>
                {trend.correct_count}/{trend.questions_answered} ·{" "}
                {Math.round(trend.accuracy_score)}%
              </Text>
            </View>
            <View
              accessibilityLabel={`${Math.round(trend.accuracy_score)} percent`}
              style={styles.barTrack}
            >
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(4, trend.accuracy_score)}%` as `${number}%` },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </AppCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <AppCard title="Loading">
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.muted}>{label}</Text>
      </View>
    </AppCard>
  );
}

function formatStatus(status: TopicProgress["status"]): string {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "Not scheduled";
}

function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const styles = StyleSheet.create({
  action: { color: theme.colors.ink, fontSize: 18, fontWeight: "800", lineHeight: 26 },
  bar: { backgroundColor: theme.colors.accent, borderRadius: 999, height: 10 },
  barTrack: {
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  disclaimer: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  },
  disclaimerText: { color: theme.colors.primary, fontSize: 13, lineHeight: 19 },
  due: { color: theme.colors.accent, fontSize: 14, fontWeight: "800" },
  loading: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm },
  metric: { minWidth: 110 },
  metricLabel: { color: theme.colors.muted, fontSize: 12 },
  metrics: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  metricValue: { color: theme.colors.ink, fontSize: 18, fontWeight: "900" },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  readinessLabel: { color: theme.colors.accent, fontSize: 15, fontWeight: "800" },
  readinessRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xl,
  },
  readinessScore: { color: theme.colors.primary, fontSize: 44, fontWeight: "900" },
  reviewBadge: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 999,
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  section: { gap: theme.spacing.lg },
  smallText: { color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  studentTab: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  studentTabSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  studentTabs: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  studentTabText: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  studentTabTextSelected: { color: theme.colors.surface },
  topicButton: { gap: theme.spacing.xs, paddingVertical: theme.spacing.sm },
  topicDetails: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  topicRow: { borderTopColor: theme.colors.border, borderTopWidth: 1 },
  topicTitle: { color: theme.colors.ink, flex: 1, fontSize: 16, fontWeight: "800" },
  topicTitleRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm },
  trendDate: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  trendLabels: { flexDirection: "row", justifyContent: "space-between" },
  trendRow: { gap: theme.spacing.xs },
});
