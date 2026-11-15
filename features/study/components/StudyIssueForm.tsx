import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { AppTextField } from "../../../components/common/AppTextField";
import { submitStudyIssue } from "../../../services/studyIssueService";
import { issueCategories, type IssueCategory } from "../issueCategories";

export function StudyIssueForm({ id, prompt }: { id: string; prompt: string }) {
  const [open, setOpen] = useState(false);
  if (!open)
    return <AppButton label="Report an issue" variant="secondary" onPress={() => setOpen(true)} />;
  return <ReportFields id={id} prompt={prompt} onCancel={() => setOpen(false)} />;
}

function ReportFields({
  id,
  prompt,
  onCancel,
}: {
  id: string;
  prompt: string;
  onCancel: () => void;
}) {
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [note, setNote] = useState("");
  const send = useMutation({ mutationFn: () => submitStudyIssue(id, categories, note.trim()) });
  if (send.isSuccess)
    return (
      <Text accessibilityRole="alert">
        Report received. Thank you for helping improve this question.
      </Text>
    );
  return (
    <AppCard
      title="Report a content issue"
      description="CAP Mastery admins can see your name and may follow up for clarification. Regular testers cannot see your report."
    >
      <Text numberOfLines={3}>{prompt}</Text>
      <Text>What needs attention? Select all that apply.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {(Object.keys(issueCategories) as IssueCategory[]).map((category) => (
          <AppButton
            key={category}
            label={`${categories.includes(category) ? "✓ " : ""}${issueCategories[category]}`}
            variant={categories.includes(category) ? "primary" : "secondary"}
            disabled={send.isPending}
            onPress={() =>
              setCategories((current) =>
                current.includes(category)
                  ? current.filter((item) => item !== category)
                  : [...current, category],
              )
            }
          />
        ))}
      </View>
      <AppTextField
        label={categories.includes("other") ? "Details (required for Other)" : "Details (optional)"}
        value={note}
        onChangeText={setNote}
        maxLength={500}
        multiline
        editable={!send.isPending}
        placeholder="What looks wrong, or what could be clearer?"
      />
      <Text>{note.length}/500</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <AppButton
          label="Cancel report"
          variant="secondary"
          disabled={send.isPending}
          onPress={() => {
            onCancel();
          }}
        />
        <AppButton
          label="Send report"
          loading={send.isPending}
          disabled={!categories.length || (categories.includes("other") && !note.trim())}
          onPress={() => send.mutate()}
        />
      </View>
      {send.isError ? (
        <Text accessibilityRole="alert">Could not send the report. Please try again.</Text>
      ) : null}
    </AppCard>
  );
}
