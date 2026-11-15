import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
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
      <View style={row}>
        {(Object.keys(labels) as IssueStatus[]).map((state) => (
          <AppButton
            key={state}
            label={labels[state]}
            variant={state === status ? "primary" : "secondary"}
            onPress={() => {
              setStatus(state);
              setPage(0);
            }}
          />
        ))}
      </View>
      {query.isPending ? <Text>Loading reports…</Text> : null}
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
      {query.data?.length === 0 ? <Text>No reports on this page.</Text> : null}
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
    <AppCard
      title={`${report.exam_title} · ${report.topic_title}`}
      description={`${labels[report.status]} · ${report.created_at.slice(0, 10)} · Reported version ${report.question_version ?? "unknown"}`}
    >
      <Text>
        Reported by {report.reporter_name}
        {report.reporter_email ? ` · ${report.reporter_email}` : ""}
      </Text>
      <Text>
        {report.categories
          .map((key) => issueCategories[key as keyof typeof issueCategories] ?? key)
          .join(" · ") || report.report_type.replaceAll("_", " ")}
      </Text>
      <Text>{report.details}</Text>
      <Text>
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
          <View style={{ gap: 6 }}>
            <Text>{snapshot.data.question.question_text}</Text>
            {snapshot.data.choices.map((c) => (
              <Text key={c.id}>
                {c.key}. {c.text}
                {c.id === snapshot.data?.answer?.correct_choice_id ? " (correct)" : ""}
              </Text>
            ))}
            <Text>{snapshot.data.answer?.explanation}</Text>
            <Text>
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
          <Text>
            {snapshot.isError
              ? "Could not load this version."
              : snapshot.isPending
                ? "Loading version…"
                : "No saved snapshot for this version."}
          </Text>
        )
      ) : null}
      <View style={row}>
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
        <Text accessibilityRole="alert">Could not change report status. Please retry.</Text>
      ) : null}
    </AppCard>
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
