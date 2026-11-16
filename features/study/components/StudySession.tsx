import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";

import { AppButton } from "../../../components/common/AppButton";
import { AppCard } from "../../../components/common/AppCard";
import { theme } from "../../../lib/constants/theme";
import { crossedMissionCheckpoint, type MissionCheckpoint } from "../../progress/missions";
import {
  useCompletePracticeTest,
  useMarkPracticeAnswerReviewed,
  usePracticeTestResults,
  usePracticeTestReviewProgress,
  useSetPracticeTestQuestionFlag,
  useSetPracticeTestPaused,
} from "../../practice/hooks/usePracticeTest";
import type { PracticeTopicResult } from "../../practice/schemas";
import { useCreateStudySession, useStudySession, useSubmitStudyAnswer } from "../hooks/useStudySession";
import { getSafeStudyMessage } from "../errors";
import { AnswerResultCard } from "./AnswerResultCard";
import { StudyIssueForm } from "./StudyIssueForm";

export function StudySessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const sessionQuery = useStudySession(sessionId);
  const submitAnswer = useSubmitStudyAnswer(sessionId);
  const completePractice = useCompletePracticeTest(sessionId);
  const setPaused = useSetPracticeTestPaused(sessionId);
  const setFlag = useSetPracticeTestQuestionFlag(sessionId);
  const markReviewed = useMarkPracticeAnswerReviewed(sessionId);
  const createStudySession = useCreateStudySession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [celebration, setCelebration] = useState<MissionCheckpoint | null>();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const questionStartedAt = useRef<number | null>(null);
  const autoCompletedRef = useRef(false);

  const session = sessionQuery.data;
  const practiceCompleted =
    session?.mode === "practice_test" && session.status === "completed";
  const practiceResults = usePracticeTestResults(sessionId, Boolean(practiceCompleted));
  const reviewProgress = usePracticeTestReviewProgress(sessionId, Boolean(practiceCompleted));

  useEffect(() => {
    if (!session) return;
    if (session.status === "completed") {
      setShowResults(true);
      return;
    }
    const firstUnanswered = session.questions.findIndex((question) => !question.attempt_id);
    if (firstUnanswered >= 0 && currentIndex === 0 && session.questions[0]?.attempt_id) {
      setCurrentIndex(firstUnanswered);
    }
  }, [currentIndex, session]);

  useEffect(() => {
    questionStartedAt.current = Date.now();
  }, [currentIndex, sessionId]);

  useEffect(() => {
    if (!session || session.mode !== "practice_test" || !session.timed) {
      setRemainingSeconds(null);
      return;
    }
    setRemainingSeconds(session.remainingSeconds);
    if (session.status !== "active" || session.isPaused) return;

    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current === null) return null;
        return Math.max(0, current - 1);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [
    session,
    session?.isPaused,
    session?.mode,
    session?.remainingSeconds,
    session?.status,
    session?.timed,
  ]);

  useEffect(() => {
    if (
      session?.mode === "practice_test" &&
      session.status === "active" &&
      session.timed &&
      remainingSeconds === 0 &&
      !autoCompletedRef.current &&
      !completePractice.isPending
    ) {
      autoCompletedRef.current = true;
      void completePractice
        .mutateAsync()
        .then(() => {
          setShowResults(true);
        })
        .catch(() => {
          autoCompletedRef.current = false;
        });
    }
  }, [completePractice, remainingSeconds, session?.mode, session?.status, session?.timed]);

  if (sessionQuery.isPending) {
    return (
      <View accessibilityLabel="Loading study session" style={styles.centered}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.muted}>Preparing your study session…</Text>
      </View>
    );
  }

  if (sessionQuery.isError || !session || session.questions.length === 0) {
    return (
      <AppCard
        title="Session unavailable"
        description={
          sessionQuery.isError
            ? getSafeStudyMessage(sessionQuery.error)
            : "This study session has no available questions."
        }
      >
        <AppButton label="Back to study catalog" onPress={() => router.replace("/study")} />
      </AppCard>
    );
  }

  const currentQuestion = session.questions[currentIndex] ?? session.questions[0];
  const chosenChoiceId =
    selectedChoices[currentQuestion.session_question_id] ??
    currentQuestion.selected_choice_id ??
    undefined;
  const selectedChoiceId = selectedChoices[currentQuestion.session_question_id];
  const answered = Boolean(currentQuestion.attempt_id);
  const delayedFeedbackActive =
    (session.mode === "practice_test" || session.mode === "challenge") &&
    !session.feedbackReleased;
  const isFullPracticeExam = session.mode === "practice_test" && session.questionCount >= 30;
  const isLastQuestion = currentIndex + 1 === session.questions.length;
  const positionPercent = Math.min(
    100,
    Math.round((currentQuestion.question_position / Math.max(1, session.questionCount)) * 100),
  );
  const showQuestionContext =
    (currentQuestion.chapter_title || currentQuestion.topic_title) &&
    !(isFullPracticeExam && session.status === "active");

  if (showResults && session.status === "completed") {
    if (session.mode === "practice_test") {
      const missedIndices = session.questions
        .map((question, index) => ({ index, question }))
        .filter(({ question }) => question.attempt_id && question.is_correct === false);
      const reviewedIds = new Set(reviewProgress.data?.reviewed_session_question_ids ?? []);
      const firstUnreviewedMissed = missedIndices.find(
        ({ question }) => !reviewedIds.has(question.session_question_id),
      );
      const firstReviewTarget = firstUnreviewedMissed ?? missedIndices[0];
      return (
        <PracticeResults
          answeredCount={session.answeredCount}
          correctCount={session.correctCount}
          error={practiceResults.isError}
          loading={practiceResults.isPending}
          missedCount={missedIndices.length}
          onBack={() => router.replace("/study")}
          onRetry={() => void practiceResults.refetch()}
          onReview={() => {
            if (firstReviewTarget) {
              setCurrentIndex(firstReviewTarget.index);
              setShowResults(false);
            }
          }}
          onStudyTopic={(topicId) => {
            const examId = practiceResults.data?.[0]?.exam_id;
            if (!examId) {
              router.replace({ pathname: "/study", params: { topicId } });
              return;
            }
            void createStudySession
              .mutateAsync({ examId, topicId })
              .then((newSessionId) => router.replace(`/study/session/${newSessionId}` as Href))
              .catch(() => router.replace({ pathname: "/study", params: { topicId } }));
          }}
          questionCount={session.questionCount}
          results={practiceResults.data}
          reviewProgress={reviewProgress.data}
        />
      );
    }

    if (session.mode === "challenge") {
      return (
        <AppCard
          title="Challenge set complete"
          description="Your answers are saved. Scores and comparisons unlock after both students complete the challenge."
        >
          <Text style={styles.supportive}>
            Check the challenge page to encourage your teammate and see when results are ready.
          </Text>
          <AppButton label="Back to challenges" onPress={() => router.replace("/challenge")} />
        </AppCard>
      );
    }

    const percentage = Math.round((session.correctCount / session.questionCount) * 100);
    return (
      <AppCard
        title="Session complete"
        description={`You answered ${session.correctCount} of ${session.questionCount} correctly (${percentage}%).`}
      >
        <View style={styles.scoreSummaryBox}>
          <Text style={styles.scorePercentText}>{percentage}%</Text>
          <Text style={styles.scoreSubText}>
            {session.correctCount} of {session.questionCount} Correct
          </Text>
        </View>
        {celebration ? (
          <View style={styles.celebrationBanner}>
            <Text style={styles.supportive}>
              {celebration.title}: {celebration.message}
            </Text>
          </View>
        ) : null}
        <Text style={styles.supportive}>
          Reviewing the source pages for missed concepts is the fastest path to steady mastery.
        </Text>
        <AppButton label="Back to study catalog" onPress={() => router.replace("/study")} />
      </AppCard>
    );
  }

  async function handleSubmit() {
    if (!selectedChoiceId || !currentQuestion) return;
    try {
      const result = await submitAnswer.mutateAsync({
        sessionQuestionId: currentQuestion.session_question_id,
        selectedChoiceId,
        responseTimeMs: Date.now() - (questionStartedAt.current ?? Date.now()),
      });
      if (session?.mode === "study" && !currentQuestion.attempt_id) {
        setCelebration(crossedMissionCheckpoint(session.answeredCount, result.answered_count));
      }
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
      const reviewedIds = new Set(reviewProgress.data?.reviewed_session_question_ids ?? []);
      const skipPreviouslyReviewed = Boolean(
        reviewProgress.data?.tracking_available && !reviewProgress.data.review_complete,
      );
      const nextMissed = session.questions.findIndex((question, index) => {
        if (index <= currentIndex || !question.attempt_id || question.is_correct !== false) {
          return false;
        }
        return !skipPreviouslyReviewed || !reviewedIds.has(question.session_question_id);
      });
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

  async function completeCurrentReview() {
    if (!currentQuestion) return;
    if (reviewProgress.data?.tracking_available && currentQuestion.is_correct === false) {
      try {
        await markReviewed.mutateAsync(currentQuestion.session_question_id);
      } catch {
        return;
      }
    }
    advance();
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
      setShowResults(true);
    } catch {
      // Retries remain available on the current screen.
    }
  }

  return (
    <View style={styles.stack}>
      {celebration && session.mode === "study" ? (
        <AppCard title={`${celebration.title}!`} description={celebration.message}>
          <AppButton
            label="Continue mission"
            variant="secondary"
            onPress={() => setCelebration(undefined)}
          />
        </AppCard>
      ) : null}

      {session.mode === "practice_test" ? (
        <AppCard
          title="Unofficial practice test"
          description="Answers are saved securely. Scores and explanations stay hidden until the test ends."
        >
          {session.allowPause ? (
            <AppButton
              label={session.isPaused ? "Resume test" : "Pause test"}
              loading={setPaused.isPending}
              onPress={() => void setPaused.mutateAsync(!session.isPaused)}
            />
          ) : session.timed ? (
            <Text style={styles.muted}>Pausing is not available for this blueprint.</Text>
          ) : null}
        </AppCard>
      ) : null}

      <View style={styles.sessionTopCard}>
        {session.mode === "study" ? (
          <View style={styles.exitBar}>
            <AppButton
              label="Back to study catalog"
              variant="secondary"
              disabled={submitAnswer.isPending}
              onPress={() => router.replace("/study")}
            />
            <Text style={styles.muted}>
              Your submitted answers are saved. You can choose another chapter.
            </Text>
          </View>
        ) : null}

        <View style={styles.progressHeaderRow}>
          {showQuestionContext ? (
            <View
              accessibilityLabel={`${chapterLabel(currentQuestion.chapter_number, currentQuestion.chapter_title)}. Topic: ${currentQuestion.topic_title ?? "General review"}`}
              style={styles.contextBlock}
            >
              <Text style={styles.contextChapter}>
                {chapterLabel(currentQuestion.chapter_number, currentQuestion.chapter_title)}
              </Text>
              <Text style={styles.contextTopic}>
                Topic: {currentQuestion.topic_title ?? "General review"}
              </Text>
            </View>
          ) : null}

          <View style={styles.progressPillsRow}>
            <View style={styles.positionPill}>
              <Text style={styles.progress}>
                Question {currentQuestion.question_position} of {session.questionCount}
              </Text>
            </View>
            {session.mode === "practice_test" && session.timed ? (
              <View style={styles.timerBadge}>
                <Text
                  accessibilityLabel={`Time remaining ${formatTimer(remainingSeconds ?? 0)}`}
                  style={styles.timer}
                >
                  Time remaining: {formatTimer(remainingSeconds ?? 0)}
                </Text>
              </View>
            ) : null}
            <View style={styles.answeredPill}>
              <Text style={styles.progressMuted}>{session.answeredCount} answered</Text>
            </View>
          </View>
        </View>

        <View style={styles.sessionBarTrack}>
          <View style={[styles.sessionBarFill, { width: `${positionPercent}%` }]} />
        </View>
      </View>

      <AppCard title={currentQuestion.question_text}>
        <View style={styles.choicesStack}>
          {currentQuestion.choices.map((choice) => {
            const selected = choice.id === chosenChoiceId;
            const correct =
              answered &&
              session.feedbackReleased &&
              choice.id === currentQuestion.correct_choice_id;
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
                <View
                  style={[
                    styles.choiceKeyBadge,
                    selected && styles.choiceKeyBadgeSelected,
                    correct && styles.choiceKeyBadgeCorrect,
                    incorrectSelection && styles.choiceKeyBadgeIncorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceKey,
                      (selected || correct || incorrectSelection) && styles.choiceKeyLight,
                    ]}
                  >
                    {choice.key}
                  </Text>
                </View>
                <Text style={styles.choiceText}>{choice.text}</Text>
              </Pressable>
            );
          })}
        </View>

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
            <View style={styles.navigationControl}>
              <AppButton
                disabled={currentIndex === 0 || session.isPaused}
                label="Back"
                onPress={goPrevious}
                variant="secondary"
              />
            </View>
            <View style={styles.navigationControl}>
              <AppButton
                disabled={session.isPaused}
                label={currentQuestion.flagged ? "Remove flag" : "Flag question"}
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
            </View>
            <View style={styles.navigationControl}>
              <AppButton
                disabled={currentIndex + 1 === session.questions.length || session.isPaused}
                label="Next"
                onPress={goNext}
                variant="secondary"
              />
            </View>
          </View>
        ) : null}

        {session.mode === "practice_test" && session.status === "active" && isLastQuestion ? (
          <AppButton
            label="Finish test and review answers"
            loading={completePractice.isPending}
            onPress={() => void finishPracticeTest()}
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

      {answered && session.feedbackReleased ? (
        <View style={styles.stack}>
          <AnswerResultCard
            explanation={currentQuestion.explanation}
            isCorrect={Boolean(currentQuestion.is_correct)}
            issueSlot={
              session.mode === "study" ? (
                <StudyIssueForm
                  key={`issue-${currentQuestion.session_question_id}`}
                  id={currentQuestion.session_question_id}
                  prompt={currentQuestion.question_text}
                />
              ) : null
            }
            key={currentQuestion.session_question_id}
            memoryAid={currentQuestion.memory_aid}
            nextLabel={nextLabel(
              session.mode,
              session.status,
              currentIndex,
              session.questions,
              reviewProgress.data,
            )}
            nextLoading={markReviewed.isPending}
            onNext={() => void completeCurrentReview()}
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
          {markReviewed.isError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              Review progress could not be saved. Please try again before continuing.
            </Text>
          ) : null}
        </View>
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
  reviewProgress,
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
  reviewProgress?: import("../../practice/schemas").PracticeReviewProgress;
}) {
  const percentage = Math.round((correctCount / questionCount) * 100);
  return (
    <View style={styles.stack}>
      <AppCard
        title="Practice test complete"
        description={`${correctCount} of ${questionCount} correct (${percentage}%). ${questionCount - answeredCount} unanswered.`}
      >
        <View style={styles.scoreSummaryBox}>
          <Text style={styles.scorePercentText}>{percentage}%</Text>
          <Text style={styles.scoreSubText}>
            {correctCount} of {questionCount} Correct
          </Text>
        </View>
        <Text style={styles.unofficial}>Unofficial study result—not an official CAP result.</Text>
        <Text style={styles.supportive}>
          Use this result to choose what to study next. One test does not define your readiness.
        </Text>
      </AppCard>
      {missedCount > 0 ? (
        <View style={styles.stack}>
          {reviewProgress ? <ReviewProgressSummary review={reviewProgress} /> : null}
          <AppButton
            label={`Review ${missedCount} missed answers and explanations`}
            onPress={onReview}
          />
        </View>
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
        <View style={styles.topicResultStack}>
          {results?.map((result) => {
            const scoreRound = Math.round(result.score_percent);
            return (
              <View key={result.topic_id} style={styles.topicResultRow}>
                <View style={styles.topicResultText}>
                  <Text style={styles.topicTitle}>{result.topic_title}</Text>
                  <Text style={styles.muted}>
                    {result.correct_count}/{result.question_count} · {scoreRound}% ·{" "}
                    {result.performance_label}
                  </Text>
                  <View style={styles.sessionBarTrack}>
                    <View
                      style={[
                        styles.sessionBarFill,
                        scoreRound >= 80
                          ? styles.barSuccess
                          : scoreRound >= 60
                            ? styles.barGold
                            : styles.barDanger,
                        { width: `${Math.min(100, Math.max(4, scoreRound))}%` },
                      ]}
                    />
                  </View>
                </View>
                <AppButton
                  label={studyLabel(result.topic_title)}
                  onPress={() => onStudyTopic(result.topic_id)}
                />
              </View>
            );
          })}
        </View>
      </AppCard>
      <AppButton label="Back to study catalog" onPress={onBack} variant="secondary" />
    </View>
  );
}

function ReviewProgressSummary({
  review,
}: {
  review: import("../../practice/schemas").PracticeReviewProgress;
}) {
  if (!review.tracking_available) {
    return (
      <AppCard
        title="Missed-answer review"
        description="Review tracking is unavailable for this earlier test."
      />
    );
  }
  return (
    <AppCard
      title="Missed-answer review"
      description={`${review.reviewed_count} of ${review.missed_count} reviewed (${review.review_percent}%).`}
    >
      <View style={styles.sessionBarTrack}>
        <View
          style={[
            styles.sessionBarFill,
            styles.barSuccess,
            { width: `${Math.min(100, Math.max(0, review.review_percent))}%` },
          ]}
        />
      </View>
      <Text style={review.review_complete ? styles.reviewComplete : styles.muted}>
        {review.review_complete
          ? "All missed explanations have been reviewed."
          : "Progress is saved after each missed explanation."}
      </Text>
    </AppCard>
  );
}

function nextLabel(
  mode: "study" | "practice_test" | "challenge",
  status: "active" | "completed" | "abandoned",
  currentIndex: number,
  questions: {
    attempt_id: string | null;
    is_correct: boolean | null;
    session_question_id: string;
  }[],
  reviewProgress?: import("../../practice/schemas").PracticeReviewProgress,
): string {
  if (mode === "practice_test" && status === "completed") {
    const reviewedIds = new Set(reviewProgress?.reviewed_session_question_ids ?? []);
    const skipPreviouslyReviewed = Boolean(
      reviewProgress?.tracking_available && !reviewProgress.review_complete,
    );
    const hasAnotherMissed = questions.some(
      (question, index) =>
        index > currentIndex &&
        question.attempt_id &&
        question.is_correct === false &&
        (!skipPreviouslyReviewed || !reviewedIds.has(question.session_question_id)),
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
  answeredPill: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  barDanger: { backgroundColor: theme.colors.accent },
  barGold: { backgroundColor: theme.colors.gold },
  barSuccess: { backgroundColor: theme.colors.success },
  celebrationBanner: {
    backgroundColor: theme.colors.goldSoft,
    borderColor: theme.colors.goldBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 12,
  },
  centered: {
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  choice: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  choiceCorrect: {
    backgroundColor: theme.colors.successSoft,
    borderColor: theme.colors.success,
    borderWidth: 1.5,
  },
  choiceIncorrect: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.danger,
    borderWidth: 1.5,
  },
  choiceKey: { color: theme.colors.inkSecondary, fontSize: 14, fontWeight: "800" },
  choiceKeyBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  choiceKeyBadgeCorrect: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  choiceKeyBadgeIncorrect: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  choiceKeyBadgeSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  choiceKeyLight: { color: theme.colors.surface },
  choiceSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  choiceText: { color: theme.colors.ink, flex: 1, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  choicesStack: { gap: 10 },
  contextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 220,
  },
  contextChapter: { color: theme.colors.ink, fontSize: 15, fontWeight: "800", lineHeight: 21 },
  contextTopic: { color: theme.colors.muted, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  error: { color: theme.colors.danger, fontSize: 14, fontWeight: "700" },
  errorBox: {
    backgroundColor: theme.colors.dangerSoft,
    borderColor: theme.colors.dangerBorder,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  exitBar: {
    alignItems: "center",
    borderBottomColor: theme.colors.borderSoft,
    borderBottomWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  muted: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  navigationControl: { flex: 1, minWidth: 120 },
  positionPill: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  progress: { color: theme.colors.primary, fontSize: 12, fontWeight: "800" },
  progressHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  progressMuted: { color: theme.colors.inkSecondary, fontSize: 12, fontWeight: "700" },
  progressPillsRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reviewComplete: { color: theme.colors.success, fontSize: 14, fontWeight: "800" },
  scorePercentText: {
    color: theme.colors.surface,
    fontSize: 34,
    fontWeight: "900",
  },
  scoreSubText: {
    color: theme.colors.goldBright,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  scoreSummaryBox: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    gap: 4,
    padding: 20,
  },
  sessionBarFill: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 999,
    height: "100%",
  },
  sessionBarTrack: {
    backgroundColor: theme.colors.borderSoft,
    borderRadius: 999,
    height: 6,
    overflow: "hidden",
  },
  sessionTopCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  stack: { gap: 16 },
  supportive: { color: theme.colors.inkSecondary, fontSize: 14, lineHeight: 21 },
  testNavigation: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timer: { color: theme.colors.surface, fontSize: 13, fontWeight: "800" },
  timerBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  topicResultRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    padding: 14,
  },
  topicResultStack: { gap: 10 },
  topicResultText: { flex: 1, gap: 4, minWidth: 220 },
  topicTitle: { color: theme.colors.ink, fontSize: 15, fontWeight: "800" },
  unofficial: { color: theme.colors.accent, fontSize: 13, fontWeight: "700", lineHeight: 19 },
});
