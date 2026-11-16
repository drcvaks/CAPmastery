import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../../components/common/AppButton";
import { AppTextField } from "../../../components/common/AppTextField";
import { theme } from "../../../lib/constants/theme";
import { submitStudyIssue } from "../../../services/studyIssueService";
import { issueCategories, type IssueCategory } from "../issueCategories";

export function StudyIssueForm({ id, prompt }: { id: string; prompt: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Pressable
        accessibilityLabel="Report an issue"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.triggerButton, pressed && styles.triggerPressed]}
      >
        <Ionicons color={theme.colors.muted} name="flag-outline" size={14} />
        <Text style={styles.triggerText}>Report an issue</Text>
      </Pressable>
    );
  }
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
  if (send.isSuccess) {
    return (
      <View style={styles.successBanner}>
        <Ionicons color={theme.colors.success} name="checkmark-circle" size={18} />
        <Text accessibilityRole="alert" style={styles.successText}>
          Report received. Thank you for helping improve this question.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.drawer}>
      <View style={styles.drawerHeader}>
        <View style={styles.drawerTitleRow}>
          <View style={styles.flagIconBadge}>
            <Ionicons color={theme.colors.accent} name="flag" size={14} />
          </View>
          <Text style={styles.drawerTitle}>Report a content issue</Text>
        </View>
        <Text style={styles.drawerDescription}>
          CAP Mastery admins can see your name and may follow up for clarification. Regular testers
          cannot see your report.
        </Text>
      </View>

      <View style={styles.promptBox}>
        <Text numberOfLines={2} style={styles.promptText}>
          {prompt}
        </Text>
      </View>

      <View style={styles.categorySection}>
        <Text style={styles.fieldInstruction}>What needs attention? Select all that apply.</Text>
        <View style={styles.chipRow}>
          {(Object.keys(issueCategories) as IssueCategory[]).map((category) => {
            const selected = categories.includes(category);
            return (
              <Pressable
                key={category}
                accessibilityLabel={issueCategories[category]}
                accessibilityRole="button"
                accessibilityState={{ disabled: send.isPending, selected }}
                disabled={send.isPending}
                onPress={() =>
                  setCategories((current) =>
                    current.includes(category)
                      ? current.filter((item) => item !== category)
                      : [...current, category],
                  )
                }
                style={({ pressed }) => [
                  styles.categoryChip,
                  selected && styles.categoryChipSelected,
                  pressed && !send.isPending && styles.triggerPressed,
                ]}
              >
                <Ionicons
                  color={selected ? theme.colors.surface : theme.colors.muted}
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={15}
                />
                <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                  {issueCategories[category]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.inputSection}>
        <AppTextField
          label={
            categories.includes("other") ? "Details (required for Other)" : "Details (optional)"
          }
          value={note}
          onChangeText={setNote}
          maxLength={500}
          multiline
          editable={!send.isPending}
          placeholder="What looks wrong, or what could be clearer?"
        />
        <Text style={styles.charCount}>{note.length}/500</Text>
      </View>

      <View style={styles.footerActions}>
        <AppButton
          label="Cancel report"
          variant="secondary"
          disabled={send.isPending}
          onPress={onCancel}
        />
        <AppButton
          label="Send report"
          loading={send.isPending}
          disabled={!categories.length || (categories.includes("other") && !note.trim())}
          onPress={() => send.mutate()}
        />
      </View>
      {send.isError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          Could not send the report. Please try again.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryChip: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    color: theme.colors.inkSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryChipTextSelected: {
    color: theme.colors.surface,
  },
  categorySection: {
    gap: 8,
  },
  charCount: {
    alignSelf: "flex-end",
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  drawer: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 14,
    marginTop: 4,
    padding: 16,
  },
  drawerDescription: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  drawerHeader: {
    gap: 4,
  },
  drawerTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  drawerTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  fieldInstruction: {
    color: theme.colors.inkSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  flagIconBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 6,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  footerActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-end",
  },
  inputSection: {
    gap: 4,
  },
  promptBox: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderLeftColor: theme.colors.borderStrong,
    borderLeftWidth: 3,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptText: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  successBanner: {
    alignItems: "center",
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  successText: {
    color: theme.colors.success,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  triggerButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  triggerPressed: {
    opacity: 0.75,
  },
  triggerText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
