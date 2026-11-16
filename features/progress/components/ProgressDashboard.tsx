import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppLinkButton } from "../../../components/common/AppLinkButton";
import { AppScreen } from "../../../components/common/AppScreen";
import { theme } from "../../../lib/constants/theme";
import { getSafeStudyMessage } from "../../study/errors";
import { useCreateStudySession } from "../../study/hooks/useStudySession";
import { READINESS_DISCLAIMER } from "../readiness";
import type { ExamProgress, LatestPracticeTopicResult, TopicProgress } from "../schemas";
import { useProgressDashboard, useProgressStudents } from "../hooks/useProgress";

type ProgressDashboardProps = {
  audience: "guardian" | "student";
  compact?: boolean;
};

export function ProgressDashboard({ audience, compact = false }: ProgressDashboardProps) {
  const router = useRouter();
  const createStudySession = useCreateStudySession();
  const students = useProgressStudents();
  const [creatingTopicId, setCreatingTopicId] = useState<string>();
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
          </View>
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
              <ExamProgressSection
                compact={compact}
                exam={exam}
                key={exam.exam_id}
                onStudyTopic={
                  audience === "student"
                    ? (topicId) => {
                        setCreatingTopicId(topicId);
                        void createStudySession
                          .mutateAsync({ examId: exam.exam_id, topicId })
                          .then((sessionId) => router.push(`/study/session/${sessionId}` as Href))
                          .catch(() => undefined)
                          .finally(() => setCreatingTopicId(undefined));
                      }
                    : undefined
                }
                startingTopicId={creatingTopicId}
                studyError={createStudySession.isError ? createStudySession.error : undefined}
              />
            ))
          )}
        </>
      )}
    </AppScreen>
  );
}

function ExamProgressSection({
  compact,
  exam,
  onStudyTopic,
  startingTopicId,
  studyError,
}: {
  compact: boolean;
  exam: ExamProgress;
  onStudyTopic?: (topicId: string) => void;
  startingTopicId?: string;
  studyError?: unknown;
}) {
  const readinessRound = Math.round(exam.readiness_score);

  return (
    <View style={styles.section}>
      <AppCard title={exam.exam_title} description={READINESS_DISCLAIMER}>
        <View style={styles.readinessHero}>
          <View
            accessible
            accessibilityLabel={`Readiness ${readinessRound} percent`}
            style={styles.readinessBadgeBox}
          >
            <Text style={styles.readinessScore}>{readinessRound}%</Text>
            <View style={styles.readinessPill}>
              <Text style={styles.readinessLabel}>{exam.readiness_label}</Text>
            </View>
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

        <View style={styles.readinessTrack}>
          <View
            style={[
              styles.readinessFill,
              { width: `${Math.min(100, Math.max(0, readinessRound))}%` },
            ]}
          />
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            High readiness requires broad question coverage. This estimate cannot guarantee an exam
            result.
          </Text>
        </View>
      </AppCard>

      <AppCard title="Recommended next step">
        <View style={styles.nextStepBanner}>
          <Text style={styles.action}>{exam.recommended_action}</Text>
          <View style={styles.nextStepMetaRow}>
            {exam.recommended_topic_title ? (
              <View style={styles.focusPill}>
                <Text style={styles.focusPillText}>Focus area: {exam.recommended_topic_title}</Text>
              </View>
            ) : null}
            {exam.due_question_count > 0 ? (
              <View style={styles.duePill}>
                <Text style={styles.due}>{exam.due_question_count} due for review</Text>
              </View>
            ) : null}
          </View>
        </View>
      </AppCard>

      {!compact ? (
        <>
          <LatestPracticeAnalysis
            onStudyTopic={onStudyTopic}
            startingTopicId={startingTopicId}
            studyError={studyError}
            topics={exam.latestPracticeTopics}
            review={exam.latestPracticeReview}
          />
          <TopicProgressList topics={exam.topics} />
          <TrendCard trends={exam.trends} />
        </>
      ) : null}
    </View>
  );
}

function LatestPracticeAnalysis({
  onStudyTopic,
  startingTopicId,
  studyError,
  topics,
  review,
}: {
  onStudyTopic?: (topicId: string) => void;
  startingTopicId?: string;
  studyError?: unknown;
  topics: LatestPracticeTopicResult[];
  review: ExamProgress["latestPracticeReview"];
}) {
  if (!topics.length) return null;
  const completedAt = topics[0]?.completed_at;
  return (
    <AppCard
      title="Latest full practice test"
      description={
        completedAt
          ? `Chapter analysis from ${new Date(completedAt).toLocaleDateString()}. It updates after each completed full test.`
          : "Chapter analysis from the latest completed full test."
      }
    >
      {review ? <ReviewProgressSummary review={review} /> : null}
      <View style={styles.practiceTopicStack}>
        {topics.map((topic) => {
          const scoreRound = Math.round(topic.score_percent);
          return (
            <View key={topic.topic_id} style={styles.practiceTopicRow}>
              <View style={styles.practiceTopicText}>
                <Text style={styles.topicTitle}>{topic.topic_title}</Text>
                <Text style={styles.muted}>
                  {topic.correct_count}/{topic.question_count} · {scoreRound}% ·{" "}
                  {topic.performance_label}
                </Text>
                <View style={styles.miniBarTrack}>
                  <View
                    style={[
                      styles.miniBarFill,
                      scoreRound >= 80
                        ? styles.barSuccess
                        : scoreRound >= 60
                          ? styles.barGold
                          : styles.barDanger,
                      { width: `${Math.min(100, Math.max(4, scoreRound))}%` },
                    ]}
                  />
                </View>
              </View>
              {onStudyTopic ? (
                <AppButton
                  label={studyLabel(topic.topic_title)}
                  loading={startingTopicId === topic.topic_id}
                  onPress={() => onStudyTopic(topic.topic_id)}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      {studyError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {getSafeStudyMessage(studyError)}
        </Text>
      ) : null}
    </AppCard>
  );
}

function ReviewProgressSummary({
  review,
}: {
  review: NonNullable<ExamProgress["latestPracticeReview"]>;
}) {
  if (!review.tracking_available) {
    return (
      <Text style={styles.muted}>
        Missed-answer review tracking is unavailable for this earlier test.
      </Text>
    );
  }
  if (review.missed_count === 0) {
    return (
      <View style={[styles.reviewSummary, styles.reviewSummaryComplete]}>
        <Text style={styles.reviewComplete}>No missed answers to review.</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.reviewSummary,
        review.review_complete ? styles.reviewSummaryComplete : styles.reviewSummaryPending,
      ]}
    >
      <Text style={review.review_complete ? styles.reviewComplete : styles.reviewPending}>
        Missed-answer review: {review.reviewed_count} of {review.missed_count} (
        {review.review_percent}%)
      </Text>
      <Text style={styles.muted}>
        {review.review_complete
          ? "All missed answers were reviewed."
          : "Open the completed test and review each missed explanation."}
      </Text>
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
      <View style={styles.topicStack}>
        {topics.map((topic) => {
          const expanded = expandedId === topic.topic_id;
          const masteryRound = Math.round(topic.mastery_score);
          const accuracyRound = Math.round(topic.accuracy_score);
          return (
            <View
              key={topic.topic_id}
              style={[styles.topicRow, topic.recommended && styles.topicRowRecommended]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpandedId(expanded ? undefined : topic.topic_id)}
                style={styles.topicButton}
              >
                <View style={styles.topicTitleRow}>
                  <Text style={styles.topicTitle}>{topic.topic_title}</Text>
                  {topic.recommended ? <Text style={styles.reviewBadge}>Review</Text> : null}
                  <Text style={styles.expandIndicator}>{expanded ? "▾" : "▸"}</Text>
                </View>
                <Text style={styles.muted}>
                  {formatStatus(topic.status)} · Mastery {masteryRound}% · Accuracy {accuracyRound}%
                </Text>
                <View style={styles.miniBarTrack}>
                  <View
                    style={[
                      styles.miniBarFill,
                      masteryRound >= 75
                        ? styles.barSuccess
                        : masteryRound >= 45
                          ? styles.barGold
                          : styles.barPrimary,
                      { width: `${Math.min(100, Math.max(4, masteryRound))}%` },
                    ]}
                  />
                </View>
              </Pressable>
              {expanded ? (
                <View style={styles.topicDetails}>
                  <View style={styles.metrics}>
                    <Metric
                      label="Question coverage"
                      value={`${topic.attempted_question_count} of ${topic.eligible_question_count}`}
                    />
                    <Metric label="Confidence" value={`${Math.round(topic.confidence_score)}%`} />
                    <Metric label="Retention" value={`${Math.round(topic.retention_score)}%`} />
                    <Metric label="Due now" value={String(topic.due_question_count)} />
                  </View>
                  <Text style={styles.smallText}>
                    Last practiced: {formatDate(topic.last_practiced_at)} · Next review:{" "}
                    {formatDate(topic.next_review_at)}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

function TrendCard({ trends }: { trends: ExamProgress["trends"] }) {
  return (
    <AppCard title="30-day trend" description="Daily accuracy for days with answered questions.">
      {!trends.length ? (
        <Text style={styles.muted}>Complete a study session to begin a trend.</Text>
      ) : (
        <View style={styles.trendStack}>
          {trends.map((trend) => (
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
          ))}
        </View>
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

function studyLabel(topicTitle: string): string {
  const chapter = topicTitle.match(/Chapter\s+(\d+)/i)?.[1];
  return chapter ? `Start Chapter ${chapter} study` : "Start topic study";
}

const styles = StyleSheet.create({
  action: { color: theme.colors.ink, fontSize: 18, fontWeight: "900", lineHeight: 25 },
  bar: { backgroundColor: theme.colors.primaryLight, borderRadius: 999, height: 10 },
  barDanger: { backgroundColor: theme.colors.accent },
  barGold: { backgroundColor: theme.colors.gold },
  barPrimary: { backgroundColor: theme.colors.primaryLight },
  barSuccess: { backgroundColor: theme.colors.success },
  barTrack: {
    backgroundColor: "#DCE6F0",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  disclaimer: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: "#B6D4EE",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 12,
  },
  disclaimerText: { color: theme.colors.primary, fontSize: 13, fontWeight: "600", lineHeight: 19 },
  due: { color: theme.colors.accent, fontSize: 13, fontWeight: "900" },
  duePill: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  error: { color: theme.colors.danger, fontSize: 15, fontWeight: "700", lineHeight: 22 },
  expandIndicator: { color: theme.colors.muted, fontSize: 16, fontWeight: "900" },
  focusPill: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.goldBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  focusPillText: { color: theme.colors.primary, fontSize: 13, fontWeight: "800" },
  loading: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm },
  metric: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexBasis: 128,
    flexGrow: 1,
    gap: 2,
    minWidth: 120,
    padding: 12,
  },
  metricLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metrics: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  metricValue: { color: theme.colors.ink, fontSize: 19, fontWeight: "900" },
  miniBarFill: { borderRadius: 999, height: "100%" },
  miniBarTrack: {
    backgroundColor: "#DCE6F0",
    borderRadius: 999,
    height: 7,
    marginTop: 4,
    overflow: "hidden",
  },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  nextStepBanner: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  nextStepMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  practiceTopicRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    padding: theme.spacing.md,
  },
  practiceTopicStack: { gap: theme.spacing.sm },
  practiceTopicText: { flex: 1, gap: 4, minWidth: 220 },
  readinessBadgeBox: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.gold,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    gap: 6,
    justifyContent: "center",
    minWidth: 150,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  readinessFill: {
    backgroundColor: theme.colors.success,
    borderRadius: 999,
    height: "100%",
  },
  readinessHero: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  readinessLabel: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  readinessPill: {
    backgroundColor: theme.colors.goldSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  readinessScore: { color: theme.colors.surface, fontSize: 40, fontWeight: "900" },
  readinessTrack: {
    backgroundColor: "#DCE6F0",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
  reviewBadge: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: 999,
    borderWidth: 1,
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  reviewComplete: { color: theme.colors.success, fontSize: 15, fontWeight: "800" },
  reviewPending: { color: theme.colors.accent, fontSize: 15, fontWeight: "800" },
  reviewSummary: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.md,
  },
  reviewSummaryComplete: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
  },
  reviewSummaryPending: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.dangerBorder,
  },
  section: { gap: theme.spacing.lg },
  smallText: { color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  studentTab: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  studentTabSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  studentTabs: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  studentTabText: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  studentTabTextSelected: { color: theme.colors.surface },
  topicButton: { gap: 6, padding: theme.spacing.md },
  topicDetails: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  topicRow: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  topicRowRecommended: {
    borderColor: theme.colors.dangerBorder,
    borderLeftColor: theme.colors.accent,
    borderLeftWidth: 4,
  },
  topicStack: { gap: theme.spacing.sm },
  topicTitle: { color: theme.colors.ink, flex: 1, fontSize: 16, fontWeight: "800" },
  topicTitleRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm },
  trendDate: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  trendLabels: { flexDirection: "row", justifyContent: "space-between" },
  trendRow: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  trendStack: { gap: theme.spacing.sm },
});
