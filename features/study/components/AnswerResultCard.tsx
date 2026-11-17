import { type ReactNode, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../../components/common/AppButton";
import { theme } from "../../../lib/constants/theme";
import { buildAnswerFeedback, explanationsOverlap } from "../feedback";
import { VisualAidViewer } from "./VisualAidViewer";

type AnswerResultCardProps = {
  explanation: string | null;
  isCorrect: boolean;
  issueSlot?: ReactNode;
  memoryAid: string | null;
  nextLabel: string;
  nextLoading?: boolean;
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
  icon,
  label,
  collapseLabel,
  onPress,
}: {
  collapseLabel: string;
  expanded: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const activeLabel = expanded ? collapseLabel : label;
  return (
    <Pressable
      accessibilityLabel={activeLabel}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.helpButton,
        expanded && styles.helpButtonExpanded,
        pressed && styles.helpButtonPressed,
      ]}
    >
      <Ionicons
        color={expanded ? theme.colors.primary : theme.colors.inkSecondary}
        name={icon}
        size={15}
      />
      <Text style={[styles.helpButtonText, expanded && styles.helpButtonTextExpanded]}>
        {activeLabel}
      </Text>
    </Pressable>
  );
}

export function AnswerResultCard({
  explanation,
  isCorrect,
  issueSlot,
  memoryAid,
  nextLabel,
  nextLoading = false,
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
    <View style={[styles.card, isCorrect ? styles.cardCorrect : styles.cardIncorrect]}>
      <View style={styles.headerRow}>
        <View style={[styles.statusBadge, isCorrect ? styles.badgeCorrect : styles.badgeIncorrect]}>
          <Ionicons
            color={isCorrect ? theme.colors.success : theme.colors.danger}
            name={isCorrect ? "checkmark-circle" : "information-circle"}
            size={18}
          />
          <Text
            accessibilityRole="header"
            style={[styles.title, isCorrect ? styles.titleCorrect : styles.titleIncorrect]}
          >
            {feedback.title}
          </Text>
        </View>
        <Text style={styles.source}>Source: {sourceReference}</Text>
      </View>

      <Text style={styles.explanation}>{feedback.primary}</Text>
      {feedback.correctConcept ? (
        <View style={styles.rememberBox}>
          <Text style={styles.correctConcept}>Remember: {feedback.correctConcept}</Text>
        </View>
      ) : null}

      {memoryAid || availableVisual || expandedParagraphs.length > 0 ? (
        <View style={styles.supportControls}>
          {memoryAid ? (
            <View style={styles.supportGroup} testID="memory-support">
              <SupportToggle
                collapseLabel="Hide memory trick"
                expanded={showMemory}
                icon="bulb-outline"
                label="Memory trick"
                onPress={() => setShowMemory((visible) => !visible)}
              />
              {showMemory ? (
                <View style={[styles.supportPanel, styles.memoryPanel]}>
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
                icon="image-outline"
                label="Show visual"
                onPress={() => setShowVisual((visible) => !visible)}
              />
              {showVisual ? (
                <View style={styles.supportPanel}>
                  <VisualAidViewer
                    onImageError={() => {
                      setVisualFailed(true);
                      setShowVisual(false);
                    }}
                    visual={availableVisual}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
          {expandedParagraphs.length > 0 ? (
            <View style={styles.supportGroup} testID="explanation-support">
              <SupportToggle
                collapseLabel="Hide explanation"
                expanded={showMore}
                icon="book-outline"
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
      ) : null}

      <View style={styles.footerBar}>
        <View style={styles.nextActionWrap}>
          <AppButton label={nextLabel} loading={nextLoading} onPress={onNext} />
        </View>
        {issueSlot ? <View style={styles.issueWrap}>{issueSlot}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeCorrect: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.successBorder,
  },
  badgeIncorrect: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardCorrect: {
    borderTopColor: theme.colors.success,
    borderTopWidth: 3,
  },
  cardIncorrect: {
    borderTopColor: theme.colors.accent,
    borderTopWidth: 3,
  },
  correctConcept: { color: theme.colors.ink, fontSize: 14, fontWeight: "700", lineHeight: 21 },
  explanation: { color: theme.colors.ink, fontSize: 15, lineHeight: 23 },
  footerBar: {
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    gap: 10,
    marginTop: 2,
    paddingTop: 14,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  helpButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  helpButtonExpanded: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryLight,
  },
  helpButtonPressed: { opacity: 0.8 },
  helpButtonText: { color: theme.colors.inkSecondary, fontSize: 13, fontWeight: "700" },
  helpButtonTextExpanded: { color: theme.colors.primary, fontWeight: "800" },
  issueWrap: {
    width: "100%",
  },
  memoryPanel: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
  },
  nextActionWrap: {
    width: "100%",
  },
  rememberBox: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  source: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  statusBadge: {
    alignItems: "center",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  supportControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  supportGroup: {
    gap: 8,
  },
  supportLabel: { color: theme.colors.primary, fontSize: 13, fontWeight: "800" },
  supportPanel: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 6,
    padding: 14,
    width: "100%",
  },
  supportText: { color: theme.colors.ink, fontSize: 14, lineHeight: 21 },
  title: {
    fontSize: 15,
    fontWeight: "800",
  },
  titleCorrect: {
    color: theme.colors.success,
  },
  titleIncorrect: {
    color: theme.colors.danger,
  },
});
