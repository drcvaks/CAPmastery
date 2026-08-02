import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppScreen } from "../../../components/common/AppScreen";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { SignOutButton } from "../../auth/components/SignOutButton";
import { QUESTION_CSV_TEMPLATE, validateQuestionCsv, type CsvPreview } from "../csv";
import {
  useDuplicateCheck,
  useQuestionCsvImport,
  useReviewQuestion,
  useReviewQueue,
  useSaveReviewQuestion,
  useSubmitQuestionReview,
} from "../hooks/useContentAdmin";
import type { ReviewEditPayload, ReviewQuestion } from "../schemas";

export function ContentAdminWorkspace() {
  const [panel, setPanel] = useState<"import" | "review">("import");
  return (
    <AppScreen
      actions={<SignOutButton />}
      description="Validate and preview CSVs, import drafts, and complete human review before students receive content."
      eyebrow="Administration"
      title="Content workspace"
    >
      <View style={styles.row}>
        <Tab active={panel === "import"} label="CSV import" onPress={() => setPanel("import")} />
        <Tab
          active={panel === "review"}
          label="Review questions"
          onPress={() => setPanel("review")}
        />
      </View>
      {panel === "import" ? <ImportPanel onReview={() => setPanel("review")} /> : <ReviewPanel />}
    </AppScreen>
  );
}

function Tab(props: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: props.active }}
      onPress={props.onPress}
      style={[styles.tab, props.active && styles.tabActive]}
    >
      <Text style={[styles.tabText, props.active && styles.tabTextActive]}>{props.label}</Text>
    </Pressable>
  );
}

function ImportPanel({ onReview }: { onReview: () => void }) {
  const [fileName, setFileName] = useState("question-import.csv");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<CsvPreview>();
  const duplicates = useDuplicateCheck();
  const importer = useQuestionCsvImport();

  function validate() {
    const result = validateQuestionCsv(csvText);
    setPreview(result);
    duplicates.reset();
    importer.reset();
    if (result.errors.length === 0 && result.rows.length > 0) {
      void duplicates.mutateAsync(result.rows).catch(() => undefined);
    }
  }

  return (
    <View style={styles.stack}>
      <AppCard
        description="Paste comma- or tab-delimited content. The template provides the canonical 37-column header."
        title="1. Prepare the CSV"
      >
        <AppTextField label="File name" onChangeText={setFileName} value={fileName} />
        <Text style={styles.label}>CSV content</Text>
        <TextInput
          accessibilityLabel="CSV content"
          multiline
          onChangeText={setCsvText}
          placeholder="Paste the CSV header and rows here"
          placeholderTextColor={theme.colors.muted}
          style={styles.csvInput}
          value={csvText}
        />
        <View style={styles.row}>
          <AppButton
            label="Load blank template"
            onPress={() => {
              setCsvText(QUESTION_CSV_TEMPLATE);
              setPreview(undefined);
            }}
            variant="secondary"
          />
          <AppButton label="Validate and preview" onPress={validate} />
        </View>
      </AppCard>

      {preview ? (
        <AppCard
          description={`${preview.rows.length} rows · ${preview.errors.length} errors · ${preview.warnings.length + (duplicates.data?.length ?? 0)} warnings`}
          title="2. Validation preview"
        >
          {preview.errors.map((item, index) => (
            <Issue key={`e-${index}`} error text={`Row ${item.row}: ${item.message}`} />
          ))}
          {preview.warnings.map((item, index) => (
            <Issue key={`w-${index}`} text={`Row ${item.row}: ${item.message}`} />
          ))}
          {duplicates.data?.map((item, index) => (
            <Issue key={`d-${index}`} text={`Row ${item.row_number}: ${item.warning}`} />
          ))}
          {duplicates.isError ? (
            <Issue error text={`Duplicate check: ${safeError(duplicates.error)}`} />
          ) : null}
          {preview.rows.slice(0, 5).map((row) => (
            <View key={row.external_id} style={styles.preview}>
              <Text style={styles.eyebrow}>{row.external_id}</Text>
              <Text style={styles.body}>{row.question_text || "Question text missing"}</Text>
              <Text style={styles.muted}>
                {row.difficulty} · {row.cognitive_level} · draft
              </Text>
            </View>
          ))}
          {preview.rows.length > 5 ? (
            <Text style={styles.muted}>First 5 of {preview.rows.length} shown.</Text>
          ) : null}
          <AppButton
            disabled={preview.errors.length > 0 || preview.rows.length === 0 || !fileName.trim()}
            label="Import all rows as drafts"
            loading={importer.isPending}
            onPress={() =>
              void importer.mutateAsync({ fileName, rows: preview.rows }).catch(() => undefined)
            }
          />
        </AppCard>
      ) : null}

      {importer.data ? (
        <AppCard
          description={`${importer.data.rows_accepted} accepted; ${importer.data.rows_rejected} rejected. No import can publish content.`}
          title={importer.data.status === "completed" ? "Import completed" : "Import rejected"}
        >
          {importer.data.error_report.map((item, index) => (
            <Issue key={`je-${index}`} error text={`Row ${item.row ?? "?"}: ${item.message}`} />
          ))}
          {importer.data.warning_report.map((item, index) => (
            <Issue key={`jw-${index}`} text={`Row ${item.row ?? "?"}: ${item.message}`} />
          ))}
          {importer.data.status === "completed" ? (
            <AppButton label="Open review queue" onPress={onReview} />
          ) : null}
        </AppCard>
      ) : null}
      {importer.isError ? (
        <Issue error text={`Import failed: ${safeError(importer.error)}`} />
      ) : null}
    </View>
  );
}

function ReviewPanel() {
  const queue = useReviewQueue();
  const [selectedId, setSelectedId] = useState<string>();
  const detail = useReviewQuestion(selectedId);

  if (selectedId) {
    return (
      <View style={styles.stack}>
        <View style={styles.backAction}>
          <AppButton
            label="Back to review queue"
            onPress={() => setSelectedId(undefined)}
            variant="secondary"
          />
        </View>
        {detail.data ? (
          <QuestionEditor detail={detail.data} />
        ) : (
          <AppCard
            description={detail.isError ? safeError(detail.error) : "Loading question…"}
            title="Question editor"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <AppCard description="Drafts and requested changes appear first." title="Review queue">
        {queue.isPending ? <Text style={styles.muted}>Loading questions…</Text> : null}
        {queue.isError ? <Issue error text={safeError(queue.error)} /> : null}
        {queue.data?.slice(0, 100).map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.question_id}
            onPress={() => setSelectedId(item.question_id)}
            style={styles.queueItem}
          >
            <Text style={styles.eyebrow}>{item.external_id ?? "No external ID"}</Text>
            <Text numberOfLines={2} style={styles.body}>
              {item.question_text}
            </Text>
            <Text style={styles.muted}>
              {item.review_status} · version {item.version}
            </Text>
          </Pressable>
        ))}
      </AppCard>
    </View>
  );
}

function QuestionEditor({ detail }: { detail: ReviewQuestion }) {
  const id = detail.question.id;
  const save = useSaveReviewQuestion(id);
  const review = useSubmitQuestionReview(id);
  const [edit, setEdit] = useState<ReviewEditPayload>(() => toEdit(detail));
  const [reason, setReason] = useState("");
  const [ratings, setRatings] = useState({ accuracy: "5", clarity: "5", source: "5", notes: "" });

  function set<K extends keyof ReviewEditPayload>(key: K, value: ReviewEditPayload[K]) {
    setEdit((current) => ({ ...current, [key]: value }));
  }

  async function decide(decision: "approve" | "request_changes" | "reject") {
    await save.mutateAsync({ payload: edit, changeReason: reason });
    return review.mutateAsync({
      accuracyRating: Number(ratings.accuracy),
      clarityRating: Number(ratings.clarity),
      sourceAlignmentRating: Number(ratings.source),
      notes: ratings.notes,
      decision,
    });
  }

  return (
    <AppCard
      description={`${detail.question.review_status} · version ${detail.question.version}. Review decisions save the displayed corrections first.`}
      title={detail.question.external_id ?? "Question editor"}
    >
      <AppTextField
        label="Question"
        multiline
        onChangeText={(value) => set("question_text", value)}
        value={edit.question_text}
      />
      <AppTextField
        label="Difficulty"
        onChangeText={(value) => set("difficulty", value as ReviewEditPayload["difficulty"])}
        value={edit.difficulty}
      />
      <AppTextField
        label="Cognitive level"
        onChangeText={(value) =>
          set("cognitive_level", value as ReviewEditPayload["cognitive_level"])
        }
        value={edit.cognitive_level}
      />
      {edit.choices.map((choice, index) => (
        <View key={choice.key} style={styles.choice}>
          <Text style={styles.eyebrow}>Choice {choice.key}</Text>
          <AppTextField
            label="Text"
            onChangeText={(text) =>
              set(
                "choices",
                edit.choices.map((item, i) => (i === index ? { ...item, text } : item)),
              )
            }
            value={choice.text}
          />
          <AppTextField
            label="Explanation"
            multiline
            onChangeText={(feedback) =>
              set(
                "choices",
                edit.choices.map((item, i) => (i === index ? { ...item, feedback } : item)),
              )
            }
            value={choice.feedback}
          />
        </View>
      ))}
      <AppTextField
        label="Correct letter"
        onChangeText={(value) => set("correct_letter", value.toUpperCase())}
        value={edit.correct_letter}
      />
      <AppTextField
        label="Main explanation"
        multiline
        onChangeText={(value) => set("explanation", value)}
        value={edit.explanation}
      />
      <AppTextField
        label="Common mistake"
        multiline
        onChangeText={(value) => set("common_mistake", value)}
        value={edit.common_mistake}
      />
      <AppTextField
        label="Remediation"
        multiline
        onChangeText={(value) => set("remediation", value)}
        value={edit.remediation}
      />
      <AppTextField
        label="Source reference"
        multiline
        onChangeText={(value) => set("source_reference", value)}
        value={edit.source_reference}
      />
      <AppTextField
        label="Source page start"
        keyboardType="number-pad"
        onChangeText={(value) => set("source_page_start", value)}
        value={edit.source_page_start}
      />
      <AppTextField
        label="Source page end"
        keyboardType="number-pad"
        onChangeText={(value) => set("source_page_end", value)}
        value={edit.source_page_end}
      />
      <AppTextField
        label="Estimated seconds"
        keyboardType="number-pad"
        onChangeText={(value) => set("estimated_time_seconds", value)}
        value={edit.estimated_time_seconds}
      />
      <Text style={styles.heading}>Final-exam classification</Text>
      <AppTextField
        label="Chapter number"
        keyboardType="number-pad"
        onChangeText={(value) => set("chapter_number", value)}
        value={edit.chapter_number}
      />
      <AppTextField
        label="Exam likeness (high, medium, or low)"
        onChangeText={(value) => set("exam_likeness", value as ReviewEditPayload["exam_likeness"])}
        value={edit.exam_likeness}
      />
      <AppTextField
        label="Distractor difficulty (basic, moderate, or close)"
        onChangeText={(value) =>
          set("distractor_difficulty", value as ReviewEditPayload["distractor_difficulty"])
        }
        value={edit.distractor_difficulty}
      />
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchTitle}>Eligible for final exam</Text>
          <Text style={styles.body}>Study mode can still use this question when disabled.</Text>
        </View>
        <Switch
          accessibilityLabel="Eligible for final exam"
          onValueChange={(value) => set("eligible_for_final_exam", value)}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          value={edit.eligible_for_final_exam}
        />
      </View>
      <AppTextField
        label="Final-exam selection weight"
        keyboardType="decimal-pad"
        onChangeText={(value) => set("final_exam_weight", value)}
        value={edit.final_exam_weight}
      />
      <AppTextField
        label="Content origin"
        onChangeText={(value) =>
          set("content_origin", value as ReviewEditPayload["content_origin"])
        }
        value={edit.content_origin}
      />
      <AppTextField
        label="Style reference"
        onChangeText={(value) =>
          set("style_reference", value as ReviewEditPayload["style_reference"])
        }
        value={edit.style_reference}
      />
      {detail.question.review_status === "approved" ? (
        <AppTextField
          label="Reason for revising approved content"
          multiline
          onChangeText={setReason}
          value={reason}
        />
      ) : null}
      <AppButton
        label="Save corrections as draft"
        loading={save.isPending}
        onPress={() =>
          void save.mutateAsync({ payload: edit, changeReason: reason }).catch(() => undefined)
        }
      />
      {save.isSuccess ? (
        <Text style={styles.success}>Draft saved; prior approved versions remain in history.</Text>
      ) : null}
      {save.isError ? <Issue error text={safeError(save.error)} /> : null}
      <Text style={styles.heading}>Quality review</Text>
      <AppTextField
        label="Accuracy 1–5"
        keyboardType="number-pad"
        onChangeText={(accuracy) => setRatings((v) => ({ ...v, accuracy }))}
        value={ratings.accuracy}
      />
      <AppTextField
        label="Clarity 1–5"
        keyboardType="number-pad"
        onChangeText={(clarity) => setRatings((v) => ({ ...v, clarity }))}
        value={ratings.clarity}
      />
      <AppTextField
        label="Source alignment 1–5"
        keyboardType="number-pad"
        onChangeText={(source) => setRatings((v) => ({ ...v, source }))}
        value={ratings.source}
      />
      <AppTextField
        label="Review notes"
        multiline
        onChangeText={(notes) => setRatings((v) => ({ ...v, notes }))}
        value={ratings.notes}
      />
      <View style={styles.row}>
        <AppButton
          label="Approve for students"
          loading={review.isPending || save.isPending}
          onPress={() => void decide("approve").catch(() => undefined)}
        />
        <AppButton
          label="Request changes"
          onPress={() => void decide("request_changes").catch(() => undefined)}
          variant="secondary"
        />
        <AppButton
          label="Reject"
          onPress={() => void decide("reject").catch(() => undefined)}
          variant="secondary"
        />
      </View>
      {review.isSuccess ? (
        <Text style={styles.success}>Review decision recorded and audited.</Text>
      ) : null}
      {review.isError ? <Issue error text={safeError(review.error)} /> : null}
    </AppCard>
  );
}

function toEdit(detail: ReviewQuestion): ReviewEditPayload {
  const correct =
    detail.choices.find((choice) => choice.id === detail.answer.correct_choice_id)?.key ?? "";
  return {
    question_text: detail.question.question_text,
    difficulty: detail.question.difficulty,
    cognitive_level: detail.question.cognitive_level,
    source_reference: detail.question.source_reference ?? "",
    source_page_start: detail.question.source_page_start?.toString() ?? "",
    source_page_end: detail.question.source_page_end?.toString() ?? "",
    estimated_time_seconds: detail.question.estimated_time_seconds?.toString() ?? "",
    chapter_number: detail.question.chapter_number?.toString() ?? "",
    exam_likeness: detail.question.exam_likeness ?? "",
    distractor_difficulty: detail.question.distractor_difficulty ?? "",
    eligible_for_final_exam: detail.question.eligible_for_final_exam ?? false,
    final_exam_weight: (detail.question.final_exam_weight ?? 0).toString(),
    content_origin: detail.question.content_origin ?? "",
    style_reference: detail.question.style_reference ?? "",
    choices: detail.choices.map((choice) => ({
      key: choice.key,
      text: choice.text,
      feedback: choice.feedback ?? "",
    })),
    correct_letter: correct,
    explanation: detail.answer.explanation,
    remediation: detail.answer.remediation ?? "",
    common_mistake: detail.answer.common_mistake ?? "",
  };
}

function Issue({ error = false, text }: { error?: boolean; text: string }) {
  return (
    <Text accessibilityRole="alert" style={error ? styles.error : styles.warning}>
      {text}
    </Text>
  );
}

function safeError(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "object" && value && "message" in value && typeof value.message === "string")
    return value.message;
  return "The request could not be completed.";
}

const styles = StyleSheet.create({
  backAction: { alignItems: "flex-start" },
  body: { color: theme.colors.ink, fontSize: 15, lineHeight: 22 },
  choice: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  csvInput: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.ink,
    fontFamily: "monospace",
    fontSize: 13,
    minHeight: 220,
    padding: theme.spacing.md,
    textAlignVertical: "top",
  },
  error: { color: theme.colors.danger, fontSize: 14, lineHeight: 20 },
  eyebrow: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
  heading: {
    color: theme.colors.ink,
    fontSize: 18,
    fontWeight: "800",
    marginTop: theme.spacing.sm,
  },
  label: { color: theme.colors.ink, fontSize: 15, fontWeight: "700" },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  preview: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  queueItem: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  stack: { gap: theme.spacing.lg },
  success: { color: theme.colors.success, fontSize: 14, fontWeight: "700" },
  switchCopy: { flex: 1, gap: 2 },
  switchRow: { alignItems: "center", flexDirection: "row", gap: theme.spacing.md },
  switchTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  tab: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  tabTextActive: { color: theme.colors.surface },
  warning: { color: theme.colors.accent, fontSize: 14, lineHeight: 20 },
});
