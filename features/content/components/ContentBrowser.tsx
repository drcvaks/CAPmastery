import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
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

export function ContentBrowser() {
  const router = useRouter();
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

  return (
    <View style={styles.stack}>
      <View style={styles.trackSelectorPanel}>
        <Text style={styles.trackSelectorLabel}>Milestone Exam Track</Text>
        <View accessibilityRole="tablist" style={styles.pills}>
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
                style={[styles.pill, selected && styles.pillSelected]}
              >
                <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>
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
            {activeExam.code === "MITCHELL_AEROSPACE" ? (
              <View style={styles.moduleStack}>
                <Text style={styles.sectionLabel}>Browse by module and chapter</Text>
                <TopicButton
                  label="All Aerospace questions"
                  onPress={() => {
                    setSelectedTopicId(undefined);
                    setExpandedModuleId(undefined);
                  }}
                  selected={!selectedTopicId}
                />
                {aerospaceModules.map((module) => {
                  const expanded = module.id === openModuleId;
                  return (
                    <View key={module.id} style={styles.moduleGroup}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded }}
                        onPress={() =>
                          setExpandedModuleId((current) =>
                            current === module.id ? undefined : module.id,
                          )
                        }
                        style={[styles.moduleButton, expanded && styles.moduleButtonExpanded]}
                      >
                        <Text style={styles.moduleButtonLabel}>{moduleButtonLabel(module)}</Text>
                        <View style={styles.moduleSymbolBadge}>
                          <Text accessibilityElementsHidden style={styles.moduleButtonSymbol}>
                            {expanded ? "Hide" : "Show"}
                          </Text>
                        </View>
                      </Pressable>
                      {expanded ? (
                        <View style={styles.moduleTopics}>
                          <Text style={styles.moduleTitle}>{module.title}</Text>
                          <View style={styles.pills}>
                            {module.topics.map((topic) => (
                              <TopicButton
                                key={topic.id}
                                label={chapterButtonLabel(topic)}
                                onPress={() => {
                                  setExpandedModuleId(module.id);
                                  setSelectedTopicId(topic.id);
                                }}
                                selected={topic.id === selectedTopicId}
                              />
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.topicSection}>
                <Text style={styles.sectionLabel}>Browse by topic</Text>
                <View style={styles.pills}>
                  <TopicButton
                    label="All approved questions"
                    onPress={() => setSelectedTopicId(undefined)}
                    selected={!selectedTopicId}
                  />
                  {activeExam.topics.map((topic) => (
                    <TopicButton
                      key={topic.id}
                      label={topic.title}
                      onPress={() => setSelectedTopicId(topic.id)}
                      selected={topic.id === selectedTopicId}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.launchActionBox}>
              <AppButton
                label="Start 10-question study session"
                loading={createSession.isPending}
                onPress={() => {
                  void createSession
                    .mutateAsync({ examId: activeExam.id, topicId: selectedTopicId })
                    .then((sessionId) => router.push(`/study/session/${sessionId}` as Href))
                    .catch(() => undefined);
                }}
              />
              {createSession.isError ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {getSafeStudyMessage(createSession.error)}
                </Text>
              ) : null}
            </View>
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
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.topicButton, selected && styles.topicButtonSelected]}
    >
      <Text style={[styles.topicLabel, selected && styles.topicLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: { color: theme.colors.ink, fontSize: 15, lineHeight: 22 },
  choiceList: { gap: 6, marginTop: 4 },
  choiceRow: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: { color: theme.colors.danger, fontSize: 15, fontWeight: "700" },
  launchActionBox: {
    borderTopColor: theme.colors.borderSoft,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
    marginTop: 4,
    paddingTop: theme.spacing.md,
  },
  loading: { alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.xl },
  moduleButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  moduleButtonExpanded: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  moduleButtonLabel: { color: theme.colors.surface, fontSize: 16, fontWeight: "800" },
  moduleButtonSymbol: { color: theme.colors.surface, fontSize: 13, fontWeight: "900" },
  moduleGroup: { gap: theme.spacing.xs },
  moduleStack: { gap: theme.spacing.sm },
  moduleSymbolBadge: {
    backgroundColor: "#FFFFFF24",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  moduleTitle: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  moduleTopics: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  muted: { color: theme.colors.muted, fontSize: 15, lineHeight: 22 },
  pill: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pillLabel: { color: theme.colors.primary, fontSize: 14, fontWeight: "800" },
  pillLabelSelected: { color: theme.colors.surface },
  pillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
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
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 3,
    textTransform: "uppercase",
  },
  questionStack: { gap: theme.spacing.md },
  questionText: { color: theme.colors.ink, fontSize: 17, fontWeight: "800", lineHeight: 24 },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  retryLabel: { color: theme.colors.surface, fontWeight: "800" },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  source: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  stack: { gap: theme.spacing.lg },
  topicButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topicButtonSelected: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.gold,
  },
  topicLabel: { color: theme.colors.inkSecondary, fontSize: 14, fontWeight: "800" },
  topicLabelSelected: { color: theme.colors.primary, fontWeight: "900" },
  topicSection: { gap: theme.spacing.sm },
  trackSelectorLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  trackSelectorPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
});
