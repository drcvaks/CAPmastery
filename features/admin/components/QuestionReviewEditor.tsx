import { useState, type PropsWithChildren } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import {
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { useSaveReviewQuestion, useSubmitQuestionReview } from "../hooks/useContentAdmin";
import type { ReviewEditPayload, ReviewQuestion } from "../schemas";

export function QuestionReviewEditor({
  detail,
  onBack,
  context,
}: {
  detail: ReviewQuestion;
  onBack: () => void;
  context?: string;
}) {
  const save = useSaveReviewQuestion(detail.question.id);
  const review = useSubmitQuestionReview(detail.question.id);
  const form = useForm<ReviewEditPayload>({ defaultValues: toEdit(detail) });
  // Every field is seeded by toEdit; hidden classification fields remain in form state.
  const edit = useWatch({
    control: form.control,
    defaultValue: toEdit(detail),
  }) as ReviewEditPayload;
  const [reason, setReason] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [ratings, setRatings] = useState({ accuracy: "5", clarity: "5", source: "5", notes: "" });
  const { width } = useWindowDimensions();
  const wide = Platform.OS === "web" && width >= 1150;
  const busy = save.isPending || review.isPending;
  const valid = Boolean(
    edit.question_text.trim() &&
    edit.explanation.trim() &&
    edit.choices.every((c) => c.text.trim()) &&
    edit.choices.some((c) => c.key === edit.correct_letter),
  );
  const reasonRequired = detail.question.review_status === "approved";
  const canSave = valid && (!reasonRequired || reason.trim().length >= 10);
  function field(name: FieldPath<ReviewEditPayload>, label: string, multiline = false) {
    return (
      <Controller
        key={name}
        control={form.control}
        name={name}
        render={({ field: input }) => (
          <AppTextField
            label={label}
            value={typeof input.value === "string" ? input.value : ""}
            onChangeText={input.onChange}
            onBlur={input.onBlur}
            multiline={multiline}
            style={multiline ? { minHeight: 76, textAlignVertical: "top" } : undefined}
            editable={!busy}
          />
        )}
      />
    );
  }
  async function persist() {
    await save.mutateAsync({ payload: edit, changeReason: reason });
    form.reset(edit);
    setReason("");
  }
  async function decide(decision: "approve" | "request_changes" | "reject") {
    await persist();
    await review.mutateAsync({
      accuracyRating: Number(ratings.accuracy),
      clarityRating: Number(ratings.clarity),
      sourceAlignmentRating: Number(ratings.source),
      notes: ratings.notes,
      decision,
    });
  }
  return (
    <View style={styles.stack}>
      <View style={styles.toolbar}>
        <AppButton
          label="Back to review queue"
          variant="secondary"
          disabled={busy}
          onPress={() => (form.formState.isDirty ? setLeaving(true) : onBack())}
        />
        <Text style={styles.muted}>
          {form.formState.isDirty ? "Unsaved corrections" : "No unsaved corrections"}
        </Text>
      </View>
      {leaving ? (
        <AppCard
          title="Unsaved corrections"
          description="Save your corrections first, or discard them before returning to the chapter list."
        >
          <AppButton label="Keep editing" onPress={() => setLeaving(false)} />
          <AppButton label="Discard corrections and return" variant="secondary" onPress={onBack} />
        </AppCard>
      ) : null}
      <Text accessibilityRole="header" style={styles.title}>
        {detail.question.external_id ?? "Question editor"}
      </Text>
      {context ? <Text style={styles.muted}>{context}</Text> : null}
      <Text style={styles.muted}>
        {detail.question.review_status} · version {detail.question.version}. Review decisions save
        the displayed corrections first.
      </Text>
      <View style={[styles.layout, wide && styles.wide]}>
        <View style={[styles.primary, wide && styles.primaryWide]}>
          <AppCard
            title="Question and choices"
            description="Edit the question and every choice together. Select the one correct answer."
          >
            {field("question_text", "Question", true)}
            <Text style={styles.answer}>
              Correct answer: {edit.correct_letter || "Choose below"}
            </Text>
            <View style={[styles.choices, wide && styles.choiceGrid]}>
              {edit.choices.map((choice, index) => {
                const correct = choice.key === edit.correct_letter;
                return (
                  <View
                    key={choice.key}
                    style={[styles.choice, wide && styles.half, correct && styles.correct]}
                  >
                    <View style={styles.choiceHeading}>
                      <Text style={styles.heading}>Choice {choice.key}</Text>
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityLabel={`Mark choice ${choice.key} correct`}
                        accessibilityState={{ checked: correct, disabled: busy }}
                        disabled={busy}
                        onPress={() =>
                          form.setValue("correct_letter", choice.key, { shouldDirty: true })
                        }
                        style={[styles.answerButton, correct && styles.answerSelected]}
                      >
                        <Text style={correct ? styles.selectedText : styles.body}>
                          {correct ? "✓ Correct answer" : "Set as correct"}
                        </Text>
                      </Pressable>
                    </View>
                    {field(`choices.${index}.text`, `Choice ${choice.key} text`, true)}
                    {field(
                      `choices.${index}.feedback`,
                      `Why choice ${choice.key} is ${correct ? "correct" : "incorrect"}`,
                      true,
                    )}
                  </View>
                );
              })}
            </View>
          </AppCard>
        </View>
        <View style={[styles.secondary, wide && styles.secondaryWide]}>
          <AppCard title="Explanation and source">
            {field("explanation", "Main explanation", true)}
            {field("source_reference", "Source reference", true)}
            <Disclosure title="Additional teaching support">
              {field("common_mistake", "Common mistake", true)}
              {field("remediation", "Remediation", true)}
            </Disclosure>
          </AppCard>
          <AppCard
            title="Review and save"
            description="Saving corrections keeps the question as a draft. Approval is a separate, audited review decision."
          >
            {reasonRequired ? (
              <AppTextField
                label="Reason for revising approved content"
                value={reason}
                onChangeText={setReason}
                editable={!busy}
                multiline
              />
            ) : null}
            {!valid ? (
              <Text style={styles.error}>
                Enter a question, four choices, a correct answer, and a main explanation.
              </Text>
            ) : null}
            <AppButton
              label="Save corrections as draft"
              loading={save.isPending}
              disabled={busy || !canSave}
              onPress={() => void persist().catch(() => undefined)}
            />
            {save.isSuccess ? (
              <Text style={styles.success}>
                Draft saved; prior approved versions remain in history.
              </Text>
            ) : null}
            {save.isError ? <ErrorText error={save.error} /> : null}
            <Disclosure title="Quality ratings and review notes">
              {(
                [
                  ["accuracy", "Accuracy 1–5"],
                  ["clarity", "Clarity 1–5"],
                  ["source", "Source alignment 1–5"],
                ] as const
              ).map(([key, label]) => (
                <AppTextField
                  key={key}
                  label={label}
                  value={ratings[key]}
                  keyboardType="number-pad"
                  editable={!busy}
                  onChangeText={(value) => setRatings((current) => ({ ...current, [key]: value }))}
                />
              ))}
              <AppTextField
                label="Review notes"
                value={ratings.notes}
                onChangeText={(notes) => setRatings((current) => ({ ...current, notes }))}
                editable={!busy}
                multiline
              />
            </Disclosure>
            <AppButton
              label="Approve for students"
              disabled={
                busy ||
                !canSave ||
                ![ratings.accuracy, ratings.clarity, ratings.source].every((value) =>
                  /^[1-5]$/.test(value),
                )
              }
              loading={review.isPending}
              onPress={() => void decide("approve").catch(() => undefined)}
            />
            <View style={styles.toolbar}>
              <AppButton
                label="Request changes"
                variant="secondary"
                disabled={busy || !canSave}
                onPress={() => void decide("request_changes").catch(() => undefined)}
              />
              <AppButton
                label="Reject"
                variant="secondary"
                disabled={busy || !canSave}
                onPress={() => void decide("reject").catch(() => undefined)}
              />
            </View>
            {review.isSuccess ? (
              <Text style={styles.success}>Review decision recorded and audited.</Text>
            ) : null}
            {review.isError ? <ErrorText error={review.error} /> : null}
          </AppCard>
        </View>
      </View>
      <Disclosure title="Classification and exam settings">
        <View style={styles.settings}>
          {(
            [
              ["difficulty", "Difficulty"],
              ["cognitive_level", "Cognitive level"],
              ["source_page_start", "Source page start"],
              ["source_page_end", "Source page end"],
              ["estimated_time_seconds", "Estimated seconds"],
              ["chapter_number", "Chapter number"],
              ["exam_likeness", "Exam likeness (high, medium, or low)"],
              ["distractor_difficulty", "Distractor difficulty (basic, moderate, or close)"],
              ["final_exam_weight", "Final-exam selection weight"],
              ["content_origin", "Content origin"],
              ["style_reference", "Style reference"],
            ] as const
          ).map(([name, label]) => (
            <View key={name} style={styles.setting}>
              {field(name, label)}
            </View>
          ))}
        </View>
        <View style={styles.toolbar}>
          <Text style={styles.body}>Eligible for final exam</Text>
          <Switch
            accessibilityLabel="Eligible for final exam"
            value={edit.eligible_for_final_exam}
            disabled={busy}
            onValueChange={(value) =>
              form.setValue("eligible_for_final_exam", value, { shouldDirty: true })
            }
          />
        </View>
      </Disclosure>
    </View>
  );
}
function Disclosure({ title, children }: PropsWithChildren<{ title: string }>) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.disclosure}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${open ? "Hide" : "Show"} ${title}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.disclosureButton}
      >
        <Text style={styles.heading}>
          {open ? "▾" : "▸"} {title}
        </Text>
      </Pressable>
      {open ? <View style={styles.stack}>{children}</View> : null}
    </View>
  );
}
function ErrorText({ error }: { error: unknown }) {
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "The review request could not be completed."}
    </Text>
  );
}
function toEdit(detail: ReviewQuestion): ReviewEditPayload {
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
    choices: detail.choices.map((c) => ({ key: c.key, text: c.text, feedback: c.feedback ?? "" })),
    correct_letter: detail.choices.find((c) => c.id === detail.answer.correct_choice_id)?.key ?? "",
    explanation: detail.answer.explanation,
    remediation: detail.answer.remediation ?? "",
    common_mistake: detail.answer.common_mistake ?? "",
  };
}
const styles = StyleSheet.create({
  stack: { gap: 16 },
  layout: { gap: 20 },
  wide: { flexDirection: "row", alignItems: "flex-start" },
  primary: { minWidth: 0 },
  primaryWide: { flex: 2 },
  secondary: { minWidth: 0, gap: 16 },
  secondaryWide: { flex: 1 },
  choices: { gap: 12 },
  choiceGrid: { flexDirection: "row", flexWrap: "wrap" },
  choice: {
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  half: { flexBasis: "47%", flexGrow: 1, minWidth: 0 },
  correct: { borderColor: theme.colors.success },
  choiceHeading: { gap: 8 },
  heading: { fontSize: 16, fontWeight: "800", color: theme.colors.ink },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.ink },
  body: { fontSize: 14, color: theme.colors.ink },
  muted: { fontSize: 14, color: theme.colors.muted },
  answer: { fontWeight: "800", color: theme.colors.success, fontSize: 16 },
  answerButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    minHeight: 40,
    padding: 10,
  },
  answerSelected: { backgroundColor: theme.colors.primary },
  selectedText: { color: theme.colors.surface, fontWeight: "700" },
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  success: { color: theme.colors.success },
  error: { color: theme.colors.danger },
  disclosure: { gap: 12 },
  disclosureButton: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
  },
  settings: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  setting: { flexBasis: 280, flexGrow: 1 },
});
