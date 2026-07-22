import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import { buildAnswerFeedback, explanationsOverlap } from "../feedback";

type AnswerResultCardProps = {
  explanation: string | null;
  isCorrect: boolean;
  memoryAid: string | null;
  nextLabel: string;
  onNext: () => void;
  remediation: string | null;
  selectedChoiceFeedback: string | null;
  shortExplanation: string | null;
  sourceReference: string;
  visual: {
    altText: string;
    caption: string;
    height: number;
    uri: string;
    width: number;
  } | null;
};

function SupportToggle({
  expanded,
  label,
  collapseLabel,
  onPress,
}: {
  collapseLabel: string;
  expanded: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [styles.helpButton, pressed && styles.helpButtonPressed]}
    >
      <Text style={styles.helpButtonText}>{expanded ? collapseLabel : label}</Text>
    </Pressable>
  );
}

export function AnswerResultCard({
  explanation,
  isCorrect,
  memoryAid,
  nextLabel,
  onNext,
  remediation,
  selectedChoiceFeedback,
  shortExplanation,
  sourceReference,
  visual,
}: AnswerResultCardProps) {
  const [showMemory, setShowMemory] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [visualFailed, setVisualFailed] = useState(false);
  const feedback = buildAnswerFeedback({
    isCorrect,
    explanation,
    shortExplanation,
    selectedChoiceFeedback,
  });
  const expandedParagraphs = useMemo(() => {
    const paragraphs: string[] = [];
    if (explanation && !explanationsOverlap(explanation, feedback.primary)) {
      paragraphs.push(explanation);
    }
    if (
      remediation &&
      ![feedback.primary, feedback.correctConcept, ...paragraphs]
        .filter(Boolean)
        .some((visible) => explanationsOverlap(remediation, visible!))
    ) {
      paragraphs.push(remediation);
    }
    return paragraphs;
  }, [explanation, feedback.correctConcept, feedback.primary, remediation]);
  const availableVisual = visual && !visualFailed ? visual : null;

  return (
    <AppCard title={feedback.title}>
      <Text style={styles.explanation}>{feedback.primary}</Text>
      {feedback.correctConcept ? (
        <Text style={styles.correctConcept}>Remember: {feedback.correctConcept}</Text>
      ) : null}

      <View style={styles.supportControls}>
        {memoryAid ? (
          <View style={styles.supportGroup} testID="memory-support">
            <SupportToggle
              collapseLabel="Hide memory trick"
              expanded={showMemory}
              label="Memory trick"
              onPress={() => setShowMemory((visible) => !visible)}
            />
            {showMemory ? (
              <View style={styles.supportPanel}>
                <Text style={styles.supportLabel}>Memory trick</Text>
                <Text style={styles.supportText}>{memoryAid}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {availableVisual ? (
          <View style={styles.supportGroup} testID="visual-support">
            <SupportToggle
              collapseLabel="Hide visual"
              expanded={showVisual}
              label="Show visual"
              onPress={() => setShowVisual((visible) => !visible)}
            />
            {showVisual ? (
              <View style={styles.supportPanel}>
                <Image
                  accessibilityLabel={availableVisual.altText}
                  accessible
                  onError={() => {
                    setVisualFailed(true);
                    setShowVisual(false);
                  }}
                  resizeMode="contain"
                  source={{ uri: availableVisual.uri }}
                  style={[
                    styles.visual,
                    { aspectRatio: availableVisual.width / availableVisual.height },
                  ]}
                />
                <Text style={styles.visualCaption}>{availableVisual.caption}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {expandedParagraphs.length > 0 ? (
          <View style={styles.supportGroup} testID="explanation-support">
            <SupportToggle
              collapseLabel="Hide explanation"
              expanded={showMore}
              label="Explain more"
              onPress={() => setShowMore((visible) => !visible)}
            />
            {showMore ? (
              <View style={styles.supportPanel}>
                {expandedParagraphs.map((paragraph) => (
                  <Text key={paragraph} style={styles.supportText}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

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
  supportControls: { gap: theme.spacing.sm },
  supportGroup: { gap: theme.spacing.sm },
  supportLabel: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  supportPanel: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  supportText: { color: theme.colors.ink, fontSize: 15, lineHeight: 23 },
  source: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 },
  visual: { alignSelf: "flex-start", maxHeight: 320, width: "100%" },
  visualCaption: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
});
