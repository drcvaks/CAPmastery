import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import {
  getStudyIssueSnapshot,
  listStudyIssues,
  setStudyIssueStatus,
  type IssueStatus,
} from "../../../services/studyIssueService";
import { issueCategories } from "../../study/issueCategories";
import { useOptionalAuth } from "../../auth/AuthContext";
import { useReviewQuestion } from "../hooks/useContentAdmin";
import { QuestionReviewEditor } from "./QuestionReviewEditor";

const labels = {
  open: "New",
  reviewing: "In review",
  resolved: "Resolved",
  dismissed: "Closed",
} as const;
const row = { flexDirection: "row", flexWrap: "wrap", gap: 8 } as const;
type Report = Awaited<ReturnType<typeof listStudyIssues>>[number];

export function StudyIssueInbox({ scrollToTop }: { scrollToTop: () => void }) {
  const viewerId = useOptionalAuth()?.session?.user.id;
  const [status, setStatus] = useState<IssueStatus>("open");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Report>();
  const query = useQuery({
    queryKey: ["admin-study-issues", viewerId, status, page],
    queryFn: () => listStudyIssues(status, page * 25),
    enabled: !editing,
    gcTime: 0,
  });
  if (editing)
    return (
      <IssueQuestionEditor
        report={editing}
        onBack={() => setEditing(undefined)}
        scrollToTop={scrollToTop}
      />
    );
  return (
    <AppCard
      title="Issue reports"
      description="Private feedback from cadets. Changes to a question still go through the question editor."
    >
      <View style={styles.filterBar}>
        {(Object.keys(labels) as IssueStatus[]).map((state) => {
          const active = state === status;
          return (
            <Pressable
              key={state}
              accessibilityLabel={labels[state]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setStatus(state);
                setPage(0);
              }}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {labels[state]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {query.isPending ? <Text style={styles.muted}>Loading reports…</Text> : null}
      {query.isError ? (
        <AppButton label="Retry loading reports" onPress={() => void query.refetch()} />
      ) : null}
      {query.data?.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onEdit={() => {
            setEditing(report);
            scrollToTop();
          }}
        />
      ))}
      {query.data?.length === 0 ? <Text style={styles.muted}>No reports on this page.</Text> : null}
      <View style={row}>
        {page > 0 ? (
          <AppButton label="Previous page" onPress={() => setPage(page - 1)} variant="secondary" />
        ) : null}
        {query.data?.length === 25 ? (
          <AppButton label="Next page" onPress={() => setPage(page + 1)} variant="secondary" />
        ) : null}
      </View>
    </AppCard>
  );
}

function ReportCard({ report, onEdit }: { report: Report; onEdit: () => void }) {
  const viewerId = useOptionalAuth()?.session?.user.id;
  const [show, setShow] = useState(false);
  const client = useQueryClient();
  const snapshot = useQuery({
    queryKey: ["admin-study-issue-version", viewerId, report.id],
    queryFn: () => getStudyIssueSnapshot(report.id),
    enabled: show,
    gcTime: 0,
  });
  const update = useMutation({
    mutationFn: (state: IssueStatus) => setStudyIssueStatus(report.id, state),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin-study-issues"] }),
  });
  return (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderCopy}>
          <Text style={styles.reportTitle}>
            {report.exam_title} · {report.topic_title}
          </Text>
          <Text style={styles.muted}>
            {labels[report.status]} · {report.created_at.slice(0, 10)} · Reported version{" "}
            {report.question_version ?? "unknown"}
          </Text>
        </View>
        <Text style={styles.categoryBadge}>
          {report.categories
            .map((key) => issueCategories[key as keyof typeof issueCategories] ?? key)
            .join(" · ") || report.report_type.replaceAll("_", " ")}
        </Text>
      </View>

      <Text style={styles.reporterText}>
        Reported by {report.reporter_name}
        {report.reporter_email ? ` · ${report.reporter_email}` : ""}
      </Text>

      <View style={styles.detailBox}>
        <Text style={styles.body}>{report.details}</Text>
      </View>

      <Text style={styles.questionText}>
        Current question (v{report.current_version}): {report.question_text}
      </Text>

      <View style={row}>
        <AppButton
          label={show ? "Hide reported version" : "View reported version"}
          onPress={() => setShow(!show)}
          variant="secondary"
        />
        <AppButton label="Open current question editor" onPress={onEdit} variant="secondary" />
      </View>
      {show ? (
        snapshot.data ? (
          <View style={styles.snapshotBox}>
            <Text style={styles.questionText}>{snapshot.data.question.question_text}</Text>
            {snapshot.data.choices.map((c) => (
              <Text key={c.id} style={styles.body}>
                {c.key}. {c.text}
                {c.id === snapshot.data?.answer?.correct_choice_id ? " (correct)" : ""}
              </Text>
            ))}
            <Text style={styles.body}>{snapshot.data.answer?.explanation}</Text>
            <Text style={styles.muted}>
              {[
                snapshot.data.question.source_reference,
                snapshot.data.learning_support?.memory_aid,
                snapshot.data.learning_support?.visual_caption ||
                  snapshot.data.learning_support?.visual_asset_key,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        ) : (
          <Text style={styles.muted}>
            {snapshot.isError
              ? "Could not load this version."
              : snapshot.isPending
                ? "Loading version…"
                : "No saved snapshot for this version."}
          </Text>
        )
      ) : null}
      <View style={styles.statusActionRow}>
        {(Object.keys(labels) as IssueStatus[])
          .filter((state) => state !== report.status)
          .map((state) => (
            <AppButton
              key={state}
              label={`Mark ${labels[state].toLowerCase()}`}
              onPress={() => update.mutate(state)}
              disabled={update.isPending}
              variant="secondary"
            />
          ))}
      </View>
      {update.isError ? (
        <Text accessibilityRole="alert" style={styles.errorAlert}>
          Could not change report status. Please retry.
        </Text>
      ) : null}
    </View>
  );
}

function IssueQuestionEditor({
  report,
  onBack,
  scrollToTop,
}: {
  report: Report;
  onBack: () => void;
  scrollToTop: () => void;
}) {
  const detail = useReviewQuestion(report.question_id);
  const [saved, setSaved] = useState(false);
  if (!detail.data)
    return (
      <AppCard
        title="Question editor"
        description={detail.isError ? "Could not load the question." : "Loading question…"}
      >
        <AppButton label="Back to issue reports" onPress={onBack} variant="secondary" />
      </AppCard>
    );
  return (
    <QuestionReviewEditor
      detail={detail.data}
      onBack={onBack}
      context={`${report.exam_title} · ${report.topic_title}`}
      position={1}
      total={1}
      saved={saved}
      onSaved={() => setSaved(true)}
      onNavigate={() => undefined}
      scrollToTop={scrollToTop}
    />
  );
}

const styles = StyleSheet.create({
  body: { color: theme.colors.ink, fontSize: 14, lineHeight: 21 },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailBox: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderLeftColor: theme.colors.accent,
    borderLeftWidth: 3,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    padding: 12,
  },
  errorAlert: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
    padding: 10,
  },
  filterBar: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 4,
  },
  filterPill: {
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
  },
  filterPillText: {
    color: theme.colors.inkSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  filterPillTextActive: {
    color: theme.colors.surface,
  },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  questionText: { color: theme.colors.ink, fontSize: 14, fontWeight: "700", lineHeight: 21 },
  reportHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  reportHeaderCopy: {
    flex: 1,
    gap: 2,
    minWidth: 200,
  },
  reportItem: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  reportTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  reporterText: { color: theme.colors.inkSecondary, fontSize: 13, fontWeight: "700" },
  snapshotBox: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  statusActionRow: {
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 10,
  },
});
