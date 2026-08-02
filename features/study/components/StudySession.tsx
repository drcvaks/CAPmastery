import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import {
  useCompletePracticeTest,
  usePracticeTestResults,
  useSetPracticeTestQuestionFlag,
  useSetPracticeTestPaused,
} from "../../practice/hooks/usePracticeTest";
import type { PracticeTopicResult } from "../../practice/schemas";
import { getSafeStudyMessage } from "../errors";
import { useStudySession, useSubmitStudyAnswer } from "../hooks/useStudySession";
import { AnswerResultCard } from "./AnswerResultCard";

export function StudySessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const sessionQuery = useStudySession(sessionId);
  const submitAnswer = useSubmitStudyAnswer(sessionId);
  const completePractice = useCompletePracticeTest(sessionId);
  const setPaused = useSetPracticeTestPaused(sessionId);
  const setFlag = useSetPracticeTestQuestionFlag(sessionId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const initialized = useRef(false);
  const timeoutRequested = useRef(false);
  const questionStartedAt = useRef<number | undefined>(undefined);

  const session = sessionQuery.data;
  const currentQuestion = session?.questions[currentIndex];
  const selectedChoiceId = currentQuestion
    ? selectedChoices[currentQuestion.session_question_id]
    : undefined;
  const practiceResults = usePracticeTestResults(
    sessionId,
    session?.mode === "practice_test" && session.status === "completed",
  );

  useEffect(() => {
    if (!session || initialized.current) return;
    const firstUnanswered = session.questions.findIndex((question) => !question.attempt_id);
    setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : session.questions.length - 1);
    setShowResults(session.status === "completed");
    initialized.current = true;
  }, [session]);

  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, [currentQuestion?.session_question_id]);

  useEffect(() => {
    if (session?.remainingSeconds !== undefined) {
      // The server timer snapshot is authoritative after a fetch or resume.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemainingSeconds(session.remainingSeconds);
    }
  }, [session?.remainingSeconds]);

  useEffect(() => {
    if (
      session?.mode !== "practice_test" ||
      session.status !== "active" ||
      !session.timed ||
      session.isPaused ||
      remainingSeconds === null
    ) {
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds, session?.isPaused, session?.mode, session?.status, session?.timed]);

  useEffect(() => {
    if (
      remainingSeconds !== 0 ||
      session?.mode !== "practice_test" ||
      session.status !== "active" ||
      timeoutRequested.current
    ) {
      return;
    }
    timeoutRequested.current = true;
    void completePractice
      .mutateAsync()
      .then(async () => {
        const refreshed = await sessionQuery.refetch();
        if (refreshed.data?.status === "completed") setShowResults(true);
      })
      .catch(() => {
        timeoutRequested.current = false;
      });
  }, [completePractice, remainingSeconds, session, sessionQuery]);

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
    if (session.mode === "practice_test") {
      return (
        <PracticeResults
          loading={practiceResults.isPending}
          onBack={() => router.replace("/study")}
          onRetry={() => void practiceResults.refetch()}
          onReview={() => {
            const firstMissed = session.questions.findIndex(
              (question) => question.attempt_id && question.is_correct === false,
            );
            if (firstMissed >= 0) {
              setCurrentIndex(firstMissed);
              setShowResults(false);
            }
          }}
          onStudyTopic={(topicId) =>
            router.replace({ pathname: "/study", params: { topicId } } as Href)
          }
          questionCount={session.questionCount}
          correctCount={session.correctCount}
          answeredCount={session.answeredCount}
          results={practiceResults.data}
          error={practiceResults.isError}
          missedCount={session.questions.filter((question) => question.is_correct === false).length}
        />
      );
    }
    if (session.mode === "challenge") {
      return (
        <AppCard
          title="Your challenge set is complete"
          description="Your effort is recorded. Shared results unlock in the Challenge tab after both students finish."
        >
          <Text style={styles.supportive}>
            Completion, improvement, and accuracy all contribute positive points. There is no public
            lowest-score ranking.
          </Text>
          <AppButton
            label="Review my answers"
            onPress={() => {
              const firstAttempted = session.questions.findIndex((question) => question.attempt_id);
              if (firstAttempted >= 0) {
                setCurrentIndex(firstAttempted);
                setShowResults(false);
              }
            }}
          />
          <AppButton
            label="Back to family challenge"
            onPress={() => router.replace("/challenge")}
            variant="secondary"
          />
        </AppCard>
      );
    }
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
  const delayedFeedbackActive =
    (session.mode === "practice_test" || session.mode === "challenge") &&
    session.status === "active";

  async function handleSubmit() {
    if (!selectedChoiceId || !currentQuestion) return;
    try {
      await submitAnswer.mutateAsync({
        sessionQuestionId: currentQuestion.session_question_id,
        selectedChoiceId,
        responseTimeMs: Date.now() - (questionStartedAt.current ?? Date.now()),
      });
      const refreshed = await sessionQuery.refetch();
      if (refreshed.data?.status === "completed") {
        setShowResults(true);
      } else if (refreshed.data?.mode === "practice_test") {
        const questions = refreshed.data.questions;
        const nextUnanswered = questions.findIndex(
          (question, index) => index > currentIndex && !question.attempt_id,
        );
        const wrappedUnanswered = questions.findIndex(
          (question, index) => index < currentIndex && !question.attempt_id,
        );
        const nextIndex = nextUnanswered >= 0 ? nextUnanswered : wrappedUnanswered;
        if (nextIndex >= 0) setCurrentIndex(nextIndex);
      }
    } catch {
      // The mutation retains its error for the retry state below.
    }
  }

  function advance() {
    if (!session) return;
    if (session.mode === "practice_test" && session.status === "completed") {
      const nextMissed = session.questions.findIndex(
        (question, index) =>
          index > currentIndex && question.attempt_id && question.is_correct === false,
      );
      if (nextMissed < 0) {
        setShowResults(true);
      } else {
        setCurrentIndex(nextMissed);
      }
      return;
    }
    if (currentIndex + 1 >= session.questions.length) {
      setShowResults(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  function goPrevious() {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function goNext() {
    if (!session) return;
    setCurrentIndex((index) => Math.min(session.questions.length - 1, index + 1));
  }

  async function finishPracticeTest() {
    try {
      await completePractice.mutateAsync();
      const refreshed = await sessionQuery.refetch();
      if (refreshed.data?.status === "completed") setShowResults(true);
    } catch {
      // The mutation exposes a safe retry message below.
    }
  }

  return (
    <View style={styles.stack}>
      {session.mode === "practice_test" ? (
        <AppCard
          title="Unofficial practice test"
          description="Answers are saved securely. Scores and explanations stay hidden until the test ends."
        >
          <View style={styles.testStatus}>
            <Text style={styles.timer}>
              {session.timed ? formatTimer(remainingSeconds ?? 0) : "Untimed"}
            </Text>
            <Text style={styles.muted}>
              {session.isPaused ? "Paused" : `${session.answeredCount} answered`}
            </Text>
          </View>
          {session.allowPause ? (
            <AppButton
              label={session.isPaused ? "Resume test" : "Pause test"}
              loading={setPaused.isPending}
              onPress={() => void setPaused.mutateAsync(!session.isPaused)}
            />
          ) : (
            <Text style={styles.muted}>Pausing is not available for this blueprint.</Text>
          )}
          <AppButton
            label="Finish test and view results"
            loading={completePractice.isPending}
            onPress={() => void finishPracticeTest()}
            variant="secondary"
          />
        </AppCard>
      ) : null}

      {currentQuestion.chapter_title || currentQuestion.topic_title ? (
        <View
          accessibilityLabel={`${chapterLabel(currentQuestion.chapter_number, currentQuestion.chapter_title)}. Topic: ${currentQuestion.topic_title ?? "General review"}`}
          style={styles.sessionContext}
        >
          <Text style={styles.contextChapter}>
            {chapterLabel(currentQuestion.chapter_number, currentQuestion.chapter_title)}
          </Text>
          <Text style={styles.contextTopic}>
            Topic: {currentQuestion.topic_title ?? "General review"}
          </Text>
        </View>
      ) : null}

      <View style={styles.progressRow}>
        <Text style={styles.progress}>
          Question {currentQuestion.question_position} of {session.questionCount}
        </Text>
        <Text style={styles.progress}>{session.answeredCount} answered</Text>
      </View>

      <AppCard title={currentQuestion.question_text}>
        {session.mode === "practice_test" && session.status === "active" ? (
          <AppButton
            disabled={session.isPaused}
            label={
              currentQuestion.flagged ? "Flagged for review — remove flag" : "Flag this question"
            }
            loading={setFlag.isPending}
            onPress={() =>
              void setFlag
                .mutateAsync({
                  sessionQuestionId: currentQuestion.session_question_id,
                  flagged: !currentQuestion.flagged,
                })
                .catch(() => undefined)
            }
            variant={currentQuestion.flagged ? "primary" : "secondary"}
          />
        ) : null}

        {currentQuestion.choices.map((choice) => {
          const selected = choice.id === chosenChoiceId;
          const correct =
            answered && session.feedbackReleased && choice.id === currentQuestion.correct_choice_id;
          const incorrectSelection =
            answered &&
            session.feedbackReleased &&
            selected &&
            currentQuestion.is_correct === false;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                checked: selected,
                disabled: answered || session.isPaused,
              }}
              disabled={answered || submitAnswer.isPending || session.isPaused}
              key={choice.id}
              onPress={() =>
                setSelectedChoices((current) => ({
                  ...current,
                  [currentQuestion.session_question_id]: choice.id,
                }))
              }
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
            disabled={!selectedChoiceId || session.isPaused}
            label="Submit answer"
            loading={submitAnswer.isPending}
            onPress={() => void handleSubmit()}
          />
        ) : null}

        {session.mode === "practice_test" && session.status === "active" ? (
          <View style={styles.testNavigation}>
            <AppButton
              disabled={currentIndex === 0 || session.isPaused}
              label="Back"
              onPress={goPrevious}
              variant="secondary"
            />
            <AppButton
              disabled={currentIndex + 1 === session.questions.length || session.isPaused}
              label="Next"
              onPress={goNext}
              variant="secondary"
            />
          </View>
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

      {answered && session.feedbackReleased ? (
        <AnswerResultCard
          explanation={currentQuestion.explanation}
          isCorrect={Boolean(currentQuestion.is_correct)}
          key={currentQuestion.session_question_id}
          memoryAid={currentQuestion.memory_aid}
          nextLabel={nextLabel(session.mode, session.status, currentIndex, session.questions)}
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
      ) : answered && delayedFeedbackActive ? (
        <AppCard
          title="Answer saved"
          description={
            session.mode === "challenge"
              ? "Correctness and explanations will be available after you finish your challenge set."
              : "Correctness and explanations will be available when the practice test ends."
          }
        >
          {session.mode === "challenge" ? (
            <AppButton
              label={
                currentIndex + 1 === session.questions.length ? "View results" : "Next question"
              }
              onPress={advance}
            />
          ) : null}
        </AppCard>
      ) : null}
      {session.mode === "practice_test" && session.status === "completed" ? (
        <AppButton
          label="Back to study catalog"
          onPress={() => router.replace("/study")}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}

function PracticeResults({
  answeredCount,
  correctCount,
  error,
  loading,
  onBack,
  onRetry,
  onReview,
  onStudyTopic,
  questionCount,
  results,
  missedCount,
}: {
  answeredCount: number;
  correctCount: number;
  error: boolean;
  loading: boolean;
  onBack: () => void;
  onRetry: () => void;
  onReview: () => void;
  onStudyTopic: (topicId: string) => void;
  questionCount: number;
  results?: PracticeTopicResult[];
  missedCount: number;
}) {
  const percentage = Math.round((correctCount / questionCount) * 100);
  return (
    <View style={styles.stack}>
      <AppCard
        title="Practice test complete"
        description={`${correctCount} of ${questionCount} correct (${percentage}%). ${questionCount - answeredCount} unanswered.`}
      >
        <Text style={styles.unofficial}>Unofficial study result—not an official CAP result.</Text>
        <Text style={styles.supportive}>
          Use this result to choose what to study next. One test does not define your readiness.
        </Text>
      </AppCard>
      {missedCount > 0 ? (
        <AppButton
          label={`Review ${missedCount} missed answers and explanations`}
          onPress={onReview}
        />
      ) : (
        <AppCard
          title="No missed answers"
          description="You answered every submitted question correctly."
        />
      )}
      <AppCard title="Topic analysis" description="Strengths and review areas from this test only.">
        {loading ? <Text style={styles.muted}>Calculating topic results…</Text> : null}
        {error ? (
          <>
            <Text accessibilityRole="alert" style={styles.error}>
              Topic analysis could not be loaded.
            </Text>
            <AppButton label="Try again" onPress={onRetry} />
          </>
        ) : null}
        {results?.map((result) => (
          <View key={result.topic_id} style={styles.topicResultRow}>
            <View style={styles.topicResultText}>
              <Text style={styles.topicTitle}>{result.topic_title}</Text>
              <Text style={styles.muted}>
                {result.correct_count}/{result.question_count} · {Math.round(result.score_percent)}%
                · {result.performance_label}
              </Text>
            </View>
            <AppButton
              label={studyLabel(result.topic_title)}
              onPress={() => onStudyTopic(result.topic_id)}
            />
          </View>
        ))}
      </AppCard>
      <AppButton label="Back to study catalog" onPress={onBack} variant="secondary" />
    </View>
  );
}

function nextLabel(
  mode: "study" | "practice_test" | "challenge",
  status: "active" | "completed" | "abandoned",
  currentIndex: number,
  questions: Array<{ attempt_id: string | null; is_correct: boolean | null }>,
): string {
  if (mode === "practice_test" && status === "completed") {
    const hasAnotherMissed = questions.some(
      (question, index) =>
        index > currentIndex && question.attempt_id && question.is_correct === false,
    );
    return hasAnotherMissed ? "Next missed answer" : "Finish review";
  }
  return currentIndex + 1 === questions.length ? "View results" : "Next question";
}

function studyLabel(topicTitle: string): string {
  const chapter = topicTitle.match(/Chapter\s+(\d+)/i)?.[1];
  return chapter ? `Study Chapter ${chapter}` : "Study this topic";
}

function chapterLabel(chapterNumber: number | null, chapterTitle: string | null): string {
  if (chapterNumber && chapterTitle) return `Chapter ${chapterNumber}: ${chapterTitle}`;
  if (chapterNumber) return `Chapter ${chapterNumber}`;
  return chapterTitle ?? "Study session";
}

function formatTimer(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
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
  contextChapter: { color: theme.colors.primary, fontSize: 18, fontWeight: "900", lineHeight: 25 },
  contextTopic: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: theme.colors.danger, fontSize: 15, fontWeight: "700" },
  errorBox: { gap: theme.spacing.xs },
  muted: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  progress: { color: theme.colors.muted, fontSize: 14, fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  sessionContext: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  stack: { gap: theme.spacing.lg },
  supportive: { color: theme.colors.ink, fontSize: 15, lineHeight: 22 },
  testStatus: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  testNavigation: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  timer: { color: theme.colors.primary, fontSize: 28, fontWeight: "900" },
  topicResult: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: theme.spacing.sm,
  },
  topicResultRow: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    paddingTop: theme.spacing.sm,
  },
  topicResultText: { flex: 1, minWidth: 220 },
  topicTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  unofficial: { color: theme.colors.accent, fontSize: 14, fontWeight: "800", lineHeight: 20 },
});
