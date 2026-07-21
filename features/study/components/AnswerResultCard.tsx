import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import { buildAnswerFeedback } from "../feedback";

type AnswerResultCardProps = {
  explanation: string | null;
  isCorrect: boolean;
  nextLabel: string;
  onNext: () => void;
  remediation: string | null;
  selectedChoiceFeedback: string | null;
  sourceReference: string;
};

export function AnswerResultCard({
  explanation,
  isCorrect,
  nextLabel,
  onNext,
  remediation,
  selectedChoiceFeedback,
  sourceReference,
}: AnswerResultCardProps) {
  const [showMoreHelp, setShowMoreHelp] = useState(false);
  const feedback = buildAnswerFeedback({ isCorrect, explanation, selectedChoiceFeedback });

  return (
    <AppCard title={feedback.title}>
      <Text style={styles.explanation}>{feedback.primary}</Text>
      {feedback.correctConcept ? (
        <Text style={styles.correctConcept}>Remember: {feedback.correctConcept}</Text>
      ) : null}

      {remediation ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showMoreHelp }}
            onPress={() => setShowMoreHelp((visible) => !visible)}
            style={({ pressed }) => [styles.helpButton, pressed && styles.helpButtonPressed]}
          >
            <Text style={styles.helpButtonText}>
              {showMoreHelp ? "Hide extra help" : "Need more help?"}
            </Text>
          </Pressable>
          {showMoreHelp ? <Text style={styles.remediation}>{remediation}</Text> : null}
        </>
      ) : null}

      <Text style={styles.source}>Source: {sourceReference}</Text>
      <AppButton label={nextLabel} onPress={onNext} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  correctConcept: { color: theme.colors.ink, fontSize: 15, lineHeight: 22 },
  explanation: { color: theme.colors.ink, fontSize: 15, lineHeight: 22 },
  helpButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  helpButtonPressed: { backgroundColor: theme.colors.background },
  helpButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  remediation: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    color: theme.colors.ink,
    fontSize: 15,
    lineHeight: 23,
    padding: theme.spacing.md,
  },
  source: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
});
