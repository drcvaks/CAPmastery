import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { groupReviewQuestions, type ReviewGroup } from "../reviewCatalog";
import type { ReviewQueueItem } from "../schemas";
import { ReviewStatusPill } from "./ReviewStatusPill";

export type ReviewSelection = { ids: string[]; index: number };

export function ReviewQuestionBrowser({
  questions,
  onSelect,
  savedIds = [],
}: {
  questions: ReviewQueueItem[];
  onSelect: (selection: ReviewSelection) => void;
  savedIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = search.trim().toLowerCase();
  const filtered = questions.filter(
    (q) =>
      (status === "all" || q.review_status === status) &&
      `${q.external_id ?? ""} ${q.question_text} ${q.exam_title} ${q.chapter_title ?? q.topic_title} ${q.module_title ?? ""}`
        .toLowerCase()
        .includes(query),
  );
  return (
    <View style={styles.stack}>
      <AppCard
        title="Review queue"
        description="Choose a test, then a chapter/module. Open a question to review all four choices and edit them together."
      >
        <AppTextField
          label="Search questions or chapters"
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.row}>
          {["all", "draft", "in_review", "approved", "rejected", "archived"].map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: status === value }}
              onPress={() => setStatus(value)}
              style={[styles.chip, status === value && styles.selected]}
            >
              <Text style={status === value ? styles.selectedText : styles.chipText}>
                {value === "all" ? "All statuses" : value.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.countBanner}>
          <Text style={styles.muted}>
            {filtered.length} of {questions.length} questions · Answers load only when you open a
            question.
          </Text>
        </View>
        {!filtered.length ? (
          <Text style={styles.muted}>No questions match these filters.</Text>
        ) : null}
      </AppCard>
      {groupReviewQuestions(filtered).map((group) => (
        <ReviewBranch key={group.key} group={group} onSelect={onSelect} savedIds={savedIds} />
      ))}
    </View>
  );
}
function ReviewBranch({
  group,
  onSelect,
  savedIds,
}: {
  group: ReviewGroup;
  onSelect: (selection: ReviewSelection) => void;
  savedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(20);
  return (
    <View style={[styles.branch, open && styles.branchOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${open ? "Collapse" : "Expand"} ${group.title}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={[styles.header, open && styles.headerOpen]}
      >
        <Text style={styles.heading}>
          {open ? "▾" : "▸"} {group.title}
        </Text>
        <Text style={styles.muted}>{group.count} questions</Text>
      </Pressable>
      {open ? (
        <View style={styles.children}>
          {group.children.map((child) => (
            <ReviewBranch key={child.key} group={child} onSelect={onSelect} savedIds={savedIds} />
          ))}
          {group.questions.slice(0, limit).map((q, index) => (
            <Pressable
              key={q.question_id}
              accessibilityRole="button"
              accessibilityLabel={`Review question ${index + 1}: ${q.question_text}`}
              onPress={() =>
                onSelect({ ids: group.questions.map((item) => item.question_id), index })
              }
              style={styles.question}
            >
              <View style={styles.questionHeader}>
                <Text style={styles.identifier}>Question {index + 1}</Text>
                <ReviewStatusPill
                  status={q.review_status}
                  saved={savedIds.includes(q.question_id)}
                />
              </View>
              <Text style={styles.body}>{q.question_text}</Text>
              <Text style={styles.actionText}>Open question and answers →</Text>
            </Pressable>
          ))}
          {limit < group.questions.length ? (
            <AppButton
              label={`Show next ${Math.min(20, group.questions.length - limit)} questions`}
              variant="secondary"
              onPress={() => setLimit((value) => value + 20)}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  actionText: { color: theme.colors.accent, fontSize: 13, fontWeight: "800" },
  body: { color: theme.colors.ink, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  branch: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  branchOpen: {
    borderColor: theme.colors.borderStrong,
  },
  children: {
    backgroundColor: theme.colors.surfaceMuted,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: 12,
    padding: 14,
  },
  chip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  countBanner: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  header: {
    backgroundColor: theme.colors.surface,
    gap: 4,
    justifyContent: "center",
    minHeight: 60,
    padding: 16,
  },
  headerOpen: {
    backgroundColor: theme.colors.primarySoft,
  },
  heading: { color: theme.colors.ink, fontSize: 17, fontWeight: "900" },
  identifier: { color: theme.colors.primary, fontSize: 13, fontWeight: "900" },
  muted: { color: theme.colors.muted, fontSize: 13, fontWeight: "600" },
  question: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  questionHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.gold,
  },
  selectedText: {
    color: theme.colors.surface,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  stack: { gap: 16 },
});
