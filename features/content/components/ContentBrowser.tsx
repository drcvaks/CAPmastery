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
                        <Text accessibilityElementsHidden style={styles.moduleButtonSymbol}>
                          {expanded ? "Hide" : "Show"}
                        </Text>
                      </Pressable>
                      {expanded ? (
                        <View style={styles.moduleTopics}>
                          <Text style={styles.moduleTitle}>{module.title}</Text>
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
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <>
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
              </>
            )}
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
          questions.data.map((question, index) => (
            <View key={question.id} style={styles.question}>
              <Text style={styles.questionNumber}>Question {index + 1}</Text>
              <Text style={styles.questionText}>{question.question_text}</Text>
              {question.choices.map((choice) => (
                <Text key={choice.id} style={styles.choice}>
                  {choice.key}. {choice.text}
                </Text>
              ))}
              <Text style={styles.source}>Source: {question.source_reference}</Text>
            </View>
          ))
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
  choice: { color: theme.colors.ink, fontSize: 15, lineHeight: 22, paddingLeft: theme.spacing.sm },
  error: { color: theme.colors.danger, fontSize: 15 },
  loading: { alignItems: "center", gap: theme.spacing.sm, padding: theme.spacing.xl },
  muted: { color: theme.colors.muted, fontSize: 15, lineHeight: 22 },
  moduleButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  moduleButtonExpanded: { backgroundColor: theme.colors.accent },
  moduleButtonLabel: { color: theme.colors.surface, fontSize: 16, fontWeight: "800" },
  moduleButtonSymbol: { color: theme.colors.surface, fontSize: 22, fontWeight: "800" },
  moduleGroup: { gap: theme.spacing.sm },
  moduleStack: { gap: theme.spacing.md },
  moduleTitle: { color: theme.colors.primary, fontSize: 14, fontWeight: "700" },
  moduleTopics: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  pill: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  pillLabel: { color: theme.colors.primary, fontSize: 14, fontWeight: "700" },
  pillLabelSelected: { color: theme.colors.surface },
  pillSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  question: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.md,
  },
  questionNumber: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  questionText: { color: theme.colors.ink, fontSize: 17, fontWeight: "700", lineHeight: 24 },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  retryLabel: { color: theme.colors.surface, fontWeight: "800" },
  sectionLabel: { color: theme.colors.ink, fontSize: 14, fontWeight: "800" },
  source: { color: theme.colors.muted, fontSize: 13, marginTop: theme.spacing.xs },
  stack: { gap: theme.spacing.lg },
  topicButton: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  topicButtonSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  topicLabel: { color: theme.colors.muted, fontSize: 14, fontWeight: "700" },
  topicLabelSelected: { color: theme.colors.accent },
});
