import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { groupReviewQuestions, type ReviewGroup } from "../reviewCatalog";
import type { ReviewQueueItem } from "../schemas";

export function ReviewQuestionBrowser({
  questions,
  onSelect,
}: {
  questions: ReviewQueueItem[];
  onSelect: (id: string) => void;
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
              <Text style={status === value ? styles.selectedText : styles.body}>
                {value === "all" ? "All statuses" : value.replace("_", " ")}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.muted}>
          {filtered.length} of {questions.length} questions · Answers load only when you open a
          question.
        </Text>
        {!filtered.length ? <Text>No questions match these filters.</Text> : null}
      </AppCard>
      {groupReviewQuestions(filtered).map((group) => (
        <ReviewBranch key={group.key} group={group} onSelect={onSelect} />
      ))}
    </View>
  );
}
function ReviewBranch({ group, onSelect }: { group: ReviewGroup; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(20);
  return (
    <View style={styles.branch}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${open ? "Collapse" : "Expand"} ${group.title}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.header}
      >
        <Text style={styles.heading}>
          {open ? "▾" : "▸"} {group.title}
        </Text>
        <Text style={styles.muted}>{group.count} questions</Text>
      </Pressable>
      {open ? (
        <View style={styles.children}>
          {group.children.map((child) => (
            <ReviewBranch key={child.key} group={child} onSelect={onSelect} />
          ))}
          {group.questions.slice(0, limit).map((q) => (
            <Pressable
              key={q.question_id}
              accessibilityRole="button"
              accessibilityLabel={`Review ${q.external_id ?? q.question_id}`}
              onPress={() => onSelect(q.question_id)}
              style={styles.question}
            >
              <View style={styles.row}>
                <Text style={styles.identifier}>{q.external_id ?? "Question"}</Text>
                <Text style={styles.muted}>
                  {q.review_status.replace("_", " ")} · v{q.version}
                </Text>
              </View>
              <Text style={styles.body}>{q.question_text}</Text>
              <Text style={styles.identifier}>Open question and answers →</Text>
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
  stack: { gap: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  branch: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: { backgroundColor: theme.colors.surface, padding: 16, gap: 4, minHeight: 60 },
  children: { padding: 12, gap: 12 },
  heading: { fontSize: 17, fontWeight: "800", color: theme.colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: theme.colors.ink },
  muted: { fontSize: 13, color: theme.colors.muted },
  identifier: { color: theme.colors.accent, fontWeight: "700" },
  question: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 10, gap: 8 },
  chip: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  selected: { backgroundColor: theme.colors.primary },
  selectedText: { color: theme.colors.surface, fontSize: 15 },
});
