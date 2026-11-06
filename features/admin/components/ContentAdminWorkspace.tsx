import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

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
} from "../hooks/useContentAdmin";
import { ReviewQuestionBrowser } from "./ReviewQuestionBrowser";
import { QuestionReviewEditor } from "./QuestionReviewEditor";
import { UserAccessAdmin } from "./UserAccessAdmin";
import { VisualLibraryAdmin } from "./VisualLibraryAdmin";

export function ContentAdminWorkspace() {
  const [panel, setPanel] = useState<"import" | "review" | "users" | "images">("users");
  return (
    <AppScreen
      actions={<SignOutButton />}
      description="Manage registered-user access and administer reviewed study content."
      eyebrow="Administration"
      title="Content workspace"
      maxContentWidth={panel === "review" ? 1480 : 1040}
    >
      <View style={styles.row}>
        <Tab active={panel === "users"} label="User access" onPress={() => setPanel("users")} />
        <Tab active={panel === "import"} label="CSV import" onPress={() => setPanel("import")} />
        <Tab active={panel === "images"} label="Image library" onPress={() => setPanel("images")} />
        <Tab
          active={panel === "review"}
          label="Review questions"
          onPress={() => setPanel("review")}
        />
      </View>
      {panel === "users" ? <UserAccessAdmin /> : null}
      {panel === "import" ? <ImportPanel onReview={() => setPanel("review")} /> : null}
      {panel === "review" ? <ReviewPanel /> : null}
      {panel === "images" ? <VisualLibraryAdmin /> : null}
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

  const selected = queue.data?.find((item) => item.question_id === selectedId);
  return (
    <View style={styles.stack}>
      {selectedId ? (
        <View style={styles.stack}>
          {!detail.data ? (
            <View style={styles.backAction}>
              <AppButton
                label="Back to review queue"
                onPress={() => setSelectedId(undefined)}
                variant="secondary"
              />
            </View>
          ) : null}
          {detail.data ? (
            <QuestionReviewEditor
              key={selectedId}
              detail={detail.data}
              onBack={() => setSelectedId(undefined)}
              context={
                selected
                  ? `${selected.exam_title} · ${selected.module_number ? `Module ${selected.module_number} · ` : ""}${selected.chapter_title ?? selected.topic_title}`
                  : undefined
              }
            />
          ) : (
            <AppCard
              description={detail.isError ? safeError(detail.error) : "Loading question…"}
              title="Question editor"
            />
          )}
        </View>
      ) : null}
      <View style={selectedId ? { display: "none" } : undefined}>
        {queue.isPending ? <Text style={styles.muted}>Loading questions…</Text> : null}
        {queue.isError ? <Issue error text={safeError(queue.error)} /> : null}
        <ReviewQuestionBrowser questions={queue.data ?? []} onSelect={setSelectedId} />
      </View>
    </View>
  );
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
