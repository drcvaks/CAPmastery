import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import { PracticeTestLauncher } from "../../practice/components/PracticeTestLauncher";
import { getSafeStudyMessage } from "../../study/errors";
import { useCreateStudySession } from "../../study/hooks/useStudySession";
import {
  chapterButtonLabel,
  groupTopicsByModule,
  moduleButtonLabel,
} from "../catalog";
import { useApprovedQuestionPreviews, useContentCatalog } from "../hooks/useContentCatalog";

function cleanModuleSubtitle(title: string): string {
  return title.replace(/^Aerospace Dimensions,\s*Module\s*\d+\s*:\s*/i, "").trim();
}

export function ContentBrowser() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoColumnModules = width >= 720;
  const params = useLocalSearchParams<{ topicId?: string }>();
  const catalog = useContentCatalog();
  const createSession = useCreateStudySession();
  const [selectedExamId, setSelectedExamId] = useState<string>();
  const [expandedModuleId, setExpandedModuleId] = useState<string>();
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(
    typeof params.topicId === "string" ? params.topicId : undefined,
  );
  const routedExamId = catalog.data?.find((exam) =>
    exam.topics.some((topic) => topic.id === selectedTopicId),
  )?.id;
  const activeExamId = selectedExamId ?? routedExamId ?? catalog.data?.[0]?.id;
  const activeExam = catalog.data?.find(({ id }) => id === activeExamId);
  const aerospaceModules =
    activeExam?.code === "MITCHELL_AEROSPACE" ? groupTopicsByModule(activeExam.topics) : [];
  const selectedModuleId = aerospaceModules.find((module) =>
    module.topics.some((topic) => topic.id === selectedTopicId),
  )?.id;
  const openModuleId = selectedModuleId ?? expandedModuleId;
  const questions = useApprovedQuestionPreviews(activeExamId, selectedTopicId);

  if (catalog.isPending) {
    return (
      <View accessibilityLabel="Loading study catalog" style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.muted}>Loading the study catalog…</Text>
      </View>
    );
  }

  if (catalog.isError) {
    return (
      <AppCard title="Catalog unavailable" description="Check the connection and try again.">
        <Pressable
          accessibilityRole="button"
          onPress={() => catalog.refetch()}
          style={styles.retry}
        >
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </AppCard>
    );
  }

  if (!catalog.data.length) {
    return (
      <AppCard
        title="No study content assigned"
        description="Ask a parent or administrator to assign a question package before starting a study session."
      />
    );
  }

  const selectedTopic = activeExam?.topics.find((topic) => topic.id === selectedTopicId);
  const selectedChapterName = selectedTopic
    ? `${selectedTopic.title}${selectedTopic.chapter?.title ? ` — ${selectedTopic.chapter.title}` : ""}`
    : null;

  function handleStartStudy(topicIdOverride?: string) {
    if (!activeExam) return;
    const targetTopicId = topicIdOverride !== undefined ? topicIdOverride : selectedTopicId;
    void createSession
      .mutateAsync({ examId: activeExam.id, topicId: targetTopicId })
      .then((sessionId) => router.push(`/study/session/${sessionId}` as Href))
      .catch(() => undefined);
  }

  return (
    <View style={styles.stack}>
      <View style={styles.trackSelectorPanel}>
        <Text style={styles.trackSelectorLabel}>1. Choose Your Milestone Exam Track</Text>
        <View accessibilityRole="tablist" style={styles.trackPills}>
          {catalog.data.map((exam) => {
            const selected = exam.id === activeExamId;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={exam.id}
                onPress={() => {
                  setSelectedExamId(exam.id);
                  setSelectedTopicId(undefined);
                  setExpandedModuleId(undefined);
                }}
                style={[styles.trackTab, selected && styles.trackTabSelected]}
              >
                <Ionicons
                  color={selected ? theme.colors.surface : theme.colors.primary}
                  name={exam.code.includes("AEROSPACE") ? "airplane-outline" : "ribbon-outline"}
                  size={16}
                />
                <Text style={[styles.trackTabLabel, selected && styles.trackTabLabelSelected]}>
                  {exam.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeExam ? (
        <>
          <AppCard title={activeExam.title} description={activeExam.description ?? undefined}>
            <View
              style={[
                styles.scopeLaunchBanner,
                selectedTopic ? styles.scopeLaunchBannerFocused : undefined,
              ]}
            >
              <View style={styles.topLaunchInfo}>
                <View style={styles.scopeEyebrowRow}>
                  <View
                    style={[
                      styles.scopeModePill,
                      selectedTopic ? styles.scopeModePillFocused : undefined,
                    ]}
                  >
                    <Ionicons
                      color={selectedTopic ? theme.colors.accent : theme.colors.primary}
                      name={selectedTopic ? "funnel" : "shuffle"}
                      size={13}
                    />
                    <Text
                      style={[
                        styles.scopeModePillText,
                        selectedTopic ? styles.scopeModePillTextFocused : undefined,
                      ]}
                    >
                      {selectedTopic
                        ? "Single-Chapter Focus (Questions limited to 1 chapter)"
                        : "All-Chapter Mix (Questions drawn from all chapters)"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.scopeTargetTitle}>
                  {selectedChapterName
                    ? `Studying only: ${selectedChapterName}`
                    : activeExam.code === "MITCHELL_AEROSPACE"
                      ? "Studying: All Aerospace modules & chapters"
                      : "Studying: All approved chapters in this track"}
                </Text>
                <Text style={styles.launchHint}>
                  {selectedTopic
                    ? "Your 10-question session will only include questions from this selected chapter."
                    : "Click any chapter below to limit your 10-question study session to that specific chapter."}
                </Text>
              </View>

              <View style={styles.topLaunchButtonWrap}>
                <AppButton
                  label="Start 10-question study session"
                  loading={createSession.isPending}
                  onPress={() => handleStartStudy()}
                />
              </View>
            </View>

            {createSession.isError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {getSafeStudyMessage(createSession.error)}
              </Text>
            ) : null}

            {activeExam.code === "MITCHELL_AEROSPACE" ? (
              <View style={styles.moduleSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderCopy}>
                    <Text style={styles.sectionLabel}>
                      2. Filter Questions by Module & Chapter
                    </Text>
                    <Text style={styles.sectionSubLabel}>
                      Open a module and select a chapter to practice only that chapter’s questions.
                    </Text>
                  </View>
                  <TopicButton
                    compact
                    label="All Aerospace questions"
                    onPress={() => {
                      setSelectedTopicId(undefined);
                      setExpandedModuleId(undefined);
                    }}
                    selected={!selectedTopicId}
                  />
                </View>

                <View style={[styles.moduleGrid, twoColumnModules && styles.moduleGridTwoCol]}>
                  {aerospaceModules.map((module) => {
                    const expanded = module.id === openModuleId;
                    const activeChapterInModule = module.topics.find(
                      (topic) => topic.id === selectedTopicId,
                    );
                    const subtitle = cleanModuleSubtitle(module.title);
                    return (
                      <View
                        key={module.id}
                        style={[
                          styles.moduleCard,
                          twoColumnModules && styles.moduleCardHalf,
                          expanded && styles.moduleCardExpanded,
                          activeChapterInModule && styles.moduleCardActive,
                        ]}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ expanded }}
                          onPress={() =>
                            setExpandedModuleId((current) =>
                              current === module.id ? undefined : module.id,
                            )
                          }
                          style={[
                            styles.moduleButton,
                            expanded && styles.moduleButtonExpanded,
                          ]}
                        >
                          <View style={styles.moduleHeaderLeft}>
                            <View
                              style={[
                                styles.moduleIconCircle,
                                expanded && styles.moduleIconCircleExpanded,
                              ]}
                            >
                              <Ionicons
                                color={expanded ? theme.colors.surface : theme.colors.primary}
                                name="planet-outline"
                                size={16}
                              />
                            </View>
                            <View style={styles.moduleHeaderCopy}>
                              <View style={styles.moduleTitleInlineRow}>
                                <Text
                                  style={[
                                    styles.moduleButtonLabel,
                                    expanded && styles.moduleButtonLabelExpanded,
                                  ]}
                                >
                                  {moduleButtonLabel(module)}
                                </Text>
                                {activeChapterInModule ? (
                                  <View style={styles.activeModuleTag}>
                                    <Text style={styles.activeModuleTagText}>Chapter selected</Text>
                                  </View>
                                ) : null}
                              </View>
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.moduleSubtitle,
                                  expanded && styles.moduleSubtitleExpanded,
                                ]}
                              >
                                {subtitle}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.moduleSymbolBadge,
                              expanded && styles.moduleSymbolBadgeExpanded,
                            ]}
                          >
                            <Text
                              accessibilityElementsHidden
                              style={[
                                styles.moduleButtonSymbol,
                                expanded && styles.moduleButtonSymbolExpanded,
                              ]}
                            >
                              {expanded ? "Hide" : "Show"}
                            </Text>
                            <Ionicons
                              color={expanded ? theme.colors.surface : theme.colors.primary}
                              name={expanded ? "chevron-up" : "chevron-down"}
                              size={13}
                            />
                          </View>
                        </Pressable>

                        {expanded ? (
                          <View style={styles.moduleTopics}>
                            <View style={styles.moduleTopicsHeader}>
                              <Text style={styles.moduleTitle}>{module.title}</Text>
                              <Text style={styles.moduleTopicsInstruction}>
                                Tap a chapter below to limit your 10-question session to that
                                chapter:
                              </Text>
                            </View>
                            <View style={styles.chapterStack}>
                              {module.topics.map((topic) => (
                                <TopicButton
                                  key={topic.id}
                                  label={chapterButtonLabel(topic)}
                                  onPress={() => {
                                    setExpandedModuleId(module.id);
                                    setSelectedTopicId(topic.id);
                                  }}
                                  selected={topic.id === selectedTopicId}
                                  showScopeHint
                                />
                              ))}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.topicSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderCopy}>
                    <Text style={styles.sectionLabel}>
                      2. Filter Questions by Chapter
                    </Text>
                    <Text style={styles.sectionSubLabel}>
                      Select a chapter below to practice only questions from that chapter, or keep
                      all chapters selected.
                    </Text>
                  </View>
                  <TopicButton
                    compact
                    label="All approved questions"
                    onPress={() => setSelectedTopicId(undefined)}
                    selected={!selectedTopicId}
                  />
                </View>

                <View style={[styles.topicGrid, twoColumnModules && styles.topicGridTwoCol]}>
                  {activeExam.topics.map((topic) => (
                    <View
                      key={topic.id}
                      style={[styles.topicGridItem, twoColumnModules && styles.topicGridItemHalf]}
                    >
                      <TopicButton
                        label={topic.title}
                        subtitle={
                          topic.chapter?.title && topic.chapter.title !== topic.title
                            ? topic.chapter.title
                            : undefined
                        }
                        onPress={() => setSelectedTopicId(topic.id)}
                        selected={topic.id === selectedTopicId}
                        showScopeHint
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </AppCard>
          <PracticeTestLauncher examId={activeExam.id} />
        </>
      ) : null}

      <AppCard
        title="Approved question preview"
        description="Browsing is read-only. Practice and server-side grading arrive later."
      >
        {questions.isPending ? (
          <ActivityIndicator
            accessibilityLabel="Loading approved questions"
            color={theme.colors.accent}
          />
        ) : questions.isError ? (
          <Text style={styles.error}>Approved questions could not be loaded.</Text>
        ) : questions.data.length === 0 ? (
          <Text style={styles.muted}>
            No owner-approved sample questions are published for this selection yet.
          </Text>
        ) : (
          <View style={styles.questionStack}>
            {questions.data.map((question, index) => (
              <View key={question.id} style={styles.question}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumber}>Question {index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{question.question_text}</Text>
                <View style={styles.choiceList}>
                  {question.choices.map((choice) => (
                    <View key={choice.id} style={styles.choiceRow}>
                      <Text style={styles.choice}>
                        {choice.key}. {choice.text}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.source}>Source: {question.source_reference}</Text>
              </View>
            ))}
          </View>
        )}
      </AppCard>
    </View>
  );
}

function TopicButton({
  compact = false,
  label,
  subtitle,
  onPress,
  selected,
  showScopeHint = false,
}: {
  compact?: boolean;
  label: string;
  subtitle?: string;
  onPress: () => void;
  selected: boolean;
  showScopeHint?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.topicButtonCompact : styles.topicButton,
        selected && styles.topicButtonSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topicButtonRow}>
        <Ionicons
          color={selected ? theme.colors.accent : theme.colors.muted}
          name={selected ? "checkmark-circle" : "radio-button-off"}
          size={18}
        />
        <View style={styles.topicButtonCopy}>
          <Text style={[styles.topicLabel, selected && styles.topicLabelSelected]}>{label}</Text>
          {subtitle ? (
            <Text style={[styles.topicSubtitle, selected && styles.topicSubtitleSelected]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {showScopeHint ? (
          <View style={[styles.scopeChip, selected && styles.scopeChipSelected]}>
            <Text style={[styles.scopeChipText, selected && styles.scopeChipTextSelected]}>
              {selected ? "Questions limited to this chapter" : "Only this chapter"}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeModuleTag: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeModuleTagText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: "800",
  },
  chapterStack: {
    gap: 8,
  },
  choice: { color: theme.colors.ink, fontSize: 14, lineHeight: 21 },
  choiceList: { gap: 6, marginTop: 4 },
  choiceRow: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: { color: theme.colors.danger, fontSize: 14, fontWeight: "700" },
  launchHint: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  loading: { alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.xl },
  moduleButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceAlt,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  moduleButtonExpanded: {
    backgroundColor: theme.colors.primary,
  },
  moduleButtonLabel: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  moduleButtonLabelExpanded: { color: theme.colors.surface },
  moduleButtonSymbol: { color: theme.colors.primary, fontSize: 12, fontWeight: "800" },
  moduleButtonSymbolExpanded: { color: theme.colors.surface },
  moduleCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  moduleCardActive: {
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
  },
  moduleCardExpanded: {
    borderColor: theme.colors.primary,
    flexBasis: "100%",
  },
  moduleCardHalf: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 270,
  },
  moduleGrid: {
    gap: 10,
  },
  moduleGridTwoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  moduleHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  moduleHeaderLeft: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  moduleIconCircle: {
    alignItems: "center",
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 8,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  moduleIconCircleExpanded: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  moduleSection: {
    gap: 12,
  },
  moduleSubtitle: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  moduleSubtitleExpanded: {
    color: "#CBD5E1",
  },
  moduleSymbolBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  moduleSymbolBadgeExpanded: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  moduleTitle: {
    color: theme.colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  moduleTitleInlineRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moduleTopics: {
    backgroundColor: theme.colors.surfaceMuted,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: 10,
    padding: 14,
  },
  moduleTopicsHeader: {
    gap: 2,
  },
  moduleTopicsInstruction: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  pressed: { opacity: 0.85 },
  question: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  questionHeader: {
    alignItems: "flex-start",
  },
  questionNumber: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.pill,
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 3,
    textTransform: "uppercase",
  },
  questionStack: { gap: theme.spacing.md },
  questionText: { color: theme.colors.ink, fontSize: 16, fontWeight: "800", lineHeight: 23 },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  retryLabel: { color: theme.colors.surface, fontWeight: "800" },
  scopeChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  scopeChipSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  scopeChipText: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  scopeChipTextSelected: {
    color: theme.colors.surface,
    fontWeight: "800",
  },
  scopeEyebrowRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scopeLaunchBanner: {
    alignItems: "center",
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.borderStrong,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 4,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "space-between",
    padding: 16,
  },
  scopeLaunchBannerFocused: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.dangerBorder,
    borderLeftColor: theme.colors.accent,
  },
  scopeModePill: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scopeModePillFocused: {
    borderColor: theme.colors.dangerBorder,
  },
  scopeModePillText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  scopeModePillTextFocused: {
    color: theme.colors.accent,
  },
  scopeTargetTitle: {
    color: theme.colors.ink,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 2,
    minWidth: 220,
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  sectionLabel: {
    color: theme.colors.ink,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sectionSubLabel: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  source: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  stack: { gap: theme.spacing.lg },
  topLaunchButtonWrap: {
    minWidth: 230,
  },
  topLaunchInfo: {
    flex: 1,
    gap: 4,
    minWidth: 240,
  },
  topicButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  topicButtonCompact: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  topicButtonCopy: {
    flex: 1,
    gap: 2,
    minWidth: 140,
  },
  topicButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  topicButtonSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
    borderWidth: 1.5,
  },
  topicGrid: {
    gap: 10,
  },
  topicGridItem: {
    minWidth: 0,
  },
  topicGridItemHalf: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 260,
  },
  topicGridTwoCol: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  topicLabel: { color: theme.colors.ink, fontSize: 14, fontWeight: "700" },
  topicLabelSelected: { color: theme.colors.primary, fontWeight: "900" },
  topicSection: { gap: 12 },
  topicSubtitle: { color: theme.colors.muted, fontSize: 12, fontWeight: "600" },
  topicSubtitleSelected: { color: theme.colors.inkSecondary },
  trackPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  trackSelectorLabel: {
    color: theme.colors.ink,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  trackSelectorPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  trackTab: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderStrong,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  trackTabLabel: { color: theme.colors.inkSecondary, fontSize: 13, fontWeight: "800" },
  trackTabLabelSelected: { color: theme.colors.surface },
  trackTabSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});
