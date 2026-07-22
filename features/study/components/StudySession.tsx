import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import { getSafeStudyMessage } from "../errors";
import { useStudySession, useSubmitStudyAnswer } from "../hooks/useStudySession";
import { AnswerResultCard } from "./AnswerResultCard";

export function StudySessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const sessionQuery = useStudySession(sessionId);
  const submitAnswer = useSubmitStudyAnswer(sessionId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>();
  const [showResults, setShowResults] = useState(false);
  const initialized = useRef(false);
  const questionStartedAt = useRef(Date.now());

  const session = sessionQuery.data;
  const currentQuestion = session?.questions[currentIndex];

  useEffect(() => {
    if (!session || initialized.current) return;
    const firstUnanswered = session.questions.findIndex((question) => !question.attempt_id);
    setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : session.questions.length - 1);
    setShowResults(session.status === "completed");
    initialized.current = true;
  }, [session]);

  useEffect(() => {
    setSelectedChoiceId(undefined);
    questionStartedAt.current = Date.now();
  }, [currentIndex]);

  if (sessionQuery.isPending) {
    return <AppCard title="Loading session" description="Preparing your approved questions…" />;
  }
  if (sessionQuery.isError || !session || !currentQuestion) {
    return (
      <AppCard title="Session unavailable" description={getSafeStudyMessage(sessionQuery.error)}>
        <AppButton label="Try again" onPress={() => void sessionQuery.refetch()} />
      </AppCard>
    );
  }

  if (showResults) {
    const percentage = Math.round((session.correctCount / session.questionCount) * 100);
    return (
      <AppCard
        title="Session complete"
        description={`You answered ${session.correctCount} of ${session.questionCount} correctly (${percentage}%).`}
      >
        <Text style={styles.supportive}>
          Review is part of learning. Your answers updated the topics and questions selected for
          future study sessions.
        </Text>
        <AppButton label="Back to study catalog" onPress={() => router.replace("/study")} />
      </AppCard>
    );
  }

  const answered = Boolean(currentQuestion.attempt_id);
  const chosenChoiceId = currentQuestion.selected_choice_id ?? selectedChoiceId;

  async function handleSubmit() {
    if (!selectedChoiceId || !currentQuestion) return;
    try {
      await submitAnswer.mutateAsync({
        sessionQuestionId: currentQuestion.session_question_id,
        selectedChoiceId,
        responseTimeMs: Date.now() - questionStartedAt.current,
      });
      await sessionQuery.refetch();
    } catch {
      // The mutation retains its error for the retry state below.
    }
  }

  function advance() {
    if (!session) return;
    if (currentIndex + 1 >= session.questions.length) {
      setShowResults(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  return (
    <View style={styles.stack}>
      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          Question {currentQuestion.question_position} of {session.questionCount}
        </Text>
        <Text style={styles.progress}>{session.answeredCount} answered</Text>
      </View>

      <AppCard title={currentQuestion.question_text}>
        {currentQuestion.choices.map((choice) => {
          const selected = choice.id === chosenChoiceId;
          const correct = answered && choice.id === currentQuestion.correct_choice_id;
          const incorrectSelection = answered && selected && !currentQuestion.is_correct;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: answered }}
              disabled={answered || submitAnswer.isPending}
              key={choice.id}
              onPress={() => setSelectedChoiceId(choice.id)}
              style={[
                styles.choice,
                selected && styles.choiceSelected,
                correct && styles.choiceCorrect,
                incorrectSelection && styles.choiceIncorrect,
              ]}
            >
              <Text style={styles.choiceKey}>{choice.key}</Text>
              <Text style={styles.choiceText}>{choice.text}</Text>
            </Pressable>
          );
        })}

        {!answered ? (
          <AppButton
            disabled={!selectedChoiceId}
            label="Submit answer"
            loading={submitAnswer.isPending}
            onPress={() => void handleSubmit()}
          />
        ) : null}

        {submitAnswer.isError && !answered ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text style={styles.error}>{getSafeStudyMessage(submitAnswer.error)}</Text>
            <Text style={styles.muted}>
              Your selected choice remains selected. Try submitting again.
            </Text>
          </View>
        ) : null}
      </AppCard>

      {answered ? (
        <AnswerResultCard
          explanation={currentQuestion.explanation}
          isCorrect={Boolean(currentQuestion.is_correct)}
          key={currentQuestion.session_question_id}
          memoryAid={currentQuestion.memory_aid}
          nextLabel={
            currentIndex + 1 === session.questions.length ? "View results" : "Next question"
          }
          onNext={advance}
          remediation={currentQuestion.remediation}
          selectedChoiceFeedback={currentQuestion.selected_choice_feedback}
          shortExplanation={currentQuestion.short_explanation}
          sourceReference={currentQuestion.source_reference}
          visual={
            currentQuestion.visual_uri &&
            currentQuestion.visual_caption &&
            currentQuestion.visual_alt_text &&
            currentQuestion.visual_width &&
            currentQuestion.visual_height
              ? {
                  altText: currentQuestion.visual_alt_text,
                  caption: currentQuestion.visual_caption,
                  height: currentQuestion.visual_height,
                  uri: currentQuestion.visual_uri,
                  width: currentQuestion.visual_width,
                }
              : null
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  choice: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  choiceCorrect: { backgroundColor: "#E4F3EA", borderColor: theme.colors.success },
  choiceIncorrect: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.danger },
  choiceKey: { color: theme.colors.accent, fontSize: 16, fontWeight: "900" },
  choiceSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
  choiceText: { color: theme.colors.ink, flex: 1, fontSize: 16, lineHeight: 23 },
  error: { color: theme.colors.danger, fontSize: 15, fontWeight: "700" },
  errorBox: { gap: theme.spacing.xs },
  muted: { color: theme.colors.muted, fontSize: 15, lineHeight: 22 },
  progress: { color: theme.colors.muted, fontSize: 14, fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  stack: { gap: theme.spacing.lg },
  supportive: { color: theme.colors.ink, fontSize: 15, lineHeight: 22 },
});
