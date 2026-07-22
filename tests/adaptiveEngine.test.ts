import {
  allocateAdaptiveBuckets,
  calculateRetentionScore,
  calculateReviewInterval,
  selectAdaptiveQuestions,
  updateMastery,
  type AdaptiveCandidate,
} from "../features/adaptive/engine";

const now = new Date("2026-07-21T12:00:00.000Z");

function candidate(overrides: Partial<AdaptiveCandidate> & { id: string }): AdaptiveCandidate {
  return {
    difficulty: "medium",
    timesSeen: 0,
    lastResult: null,
    lastSeenAt: null,
    nextReviewAt: null,
    topicAttempts: 0,
    topicMastery: 40,
    topicStatus: "not_started",
    ...overrides,
  };
}

describe("mastery updates", () => {
  it("starts new topics at neutral mastery and rewards harder/application answers more", () => {
    const easy = updateMastery({
      correct: true,
      difficulty: "easy",
      cognitiveLevel: "recall",
      now,
    });
    const hard = updateMastery({
      correct: true,
      difficulty: "hard",
      cognitiveLevel: "application",
      now,
    });
    expect(easy.masteryScore).toBe(45);
    expect(hard.masteryScore).toBe(51);
    expect(hard.masteryScore).toBeGreaterThan(easy.masteryScore);
  });

  it("penalizes an easy miss and a confident misconception more strongly", () => {
    const unsure = updateMastery({
      correct: false,
      difficulty: "easy",
      cognitiveLevel: "recall",
      confidence: 1,
      now,
    });
    const confident = updateMastery({
      correct: false,
      difficulty: "easy",
      cognitiveLevel: "recall",
      confidence: 5,
      now,
    });
    expect(unsure.masteryScore).toBe(30);
    expect(confident.masteryScore).toBe(28);
  });

  it("marks repeated misses for review and caps all scores", () => {
    const update = updateMastery({
      previous: {
        attemptsCount: 3,
        correctCount: 1,
        recentAccuracy: 40,
        masteryScore: 3,
        confidenceScore: 30,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 1,
        lastPracticedAt: new Date("2026-07-20T12:00:00.000Z"),
      },
      correct: false,
      difficulty: "easy",
      cognitiveLevel: "recall",
      now,
    });
    expect(update.masteryScore).toBe(0);
    expect(update.status).toBe("needs_review");
    expect(update.nextReviewAt.toISOString()).toBe("2026-07-22T12:00:00.000Z");
  });

  it("uses the documented spaced-review baseline", () => {
    expect(calculateReviewInterval(false, 0)).toBe(1);
    expect([1, 2, 3, 4, 5].map((streak) => calculateReviewInterval(true, streak))).toEqual([
      2, 5, 10, 17, 29,
    ]);
  });

  it("decays retention confidence with injected time without erasing mastery", () => {
    const recent = calculateRetentionScore(80, 80, now, now);
    const older = calculateRetentionScore(80, 80, now, new Date("2026-08-10T12:00:00.000Z"));
    expect(recent).toBe(80);
    expect(older).toBeLessThan(recent);
    expect(older).toBeGreaterThan(0);
  });
});

describe("adaptive selection", () => {
  it("allocates the standard ten-question 40/20/20/10/10 mix", () => {
    expect(allocateAdaptiveBuckets(10)).toEqual({
      weak_topic: 4,
      recently_missed: 2,
      developing_topic: 2,
      retention_check: 1,
      new_or_harder: 1,
    });
  });

  it("selects repeated weaknesses more often and records every reason", () => {
    const questions = [
      ...Array.from({ length: 6 }, (_, index) =>
        candidate({
          id: `weak-${index}`,
          topicAttempts: 3,
          topicMastery: 25,
          topicStatus: "needs_review",
        }),
      ),
      ...Array.from({ length: 3 }, (_, index) =>
        candidate({
          id: `miss-${index}`,
          timesSeen: 1,
          lastResult: false,
          nextReviewAt: new Date("2026-07-21T11:00:00.000Z"),
        }),
      ),
      ...Array.from({ length: 3 }, (_, index) =>
        candidate({
          id: `developing-${index}`,
          topicAttempts: 2,
          topicMastery: 50,
          topicStatus: "developing",
        }),
      ),
      candidate({
        id: "retention",
        timesSeen: 2,
        topicAttempts: 4,
        topicMastery: 75,
        topicStatus: "proficient",
        nextReviewAt: new Date("2026-07-20T12:00:00.000Z"),
      }),
      candidate({ id: "new" }),
    ];
    const selected = selectAdaptiveQuestions(questions, 10, now, "fixed");
    const counts = selected.reduce<Record<string, number>>((result, item) => {
      result[item.selectionReason] = (result[item.selectionReason] ?? 0) + 1;
      return result;
    }, {});
    expect(counts).toEqual({
      weak_topic: 4,
      recently_missed: 2,
      developing_topic: 2,
      retention_check: 1,
      new_or_harder: 1,
    });
    expect(new Set(selected.map(({ id }) => id)).size).toBe(10);
  });

  it("prefers less-seen wording and deterministically fills exhausted buckets", () => {
    const questions = Array.from({ length: 12 }, (_, index) =>
      candidate({
        id: `question-${index}`,
        timesSeen: index < 2 ? 4 : 0,
        lastSeenAt: index < 2 ? new Date("2026-07-21T11:30:00.000Z") : null,
      }),
    );
    const first = selectAdaptiveQuestions(questions, 10, now, "repeatable");
    const replay = selectAdaptiveQuestions(questions, 10, now, "repeatable");
    expect(first.map(({ id }) => id)).toEqual(replay.map(({ id }) => id));
    expect(first.map(({ id }) => id)).not.toContain("question-0");
    expect(first.map(({ id }) => id)).not.toContain("question-1");
  });

  it("fails clearly instead of duplicating questions in a sparse bank", () => {
    expect(() => selectAdaptiveQuestions([candidate({ id: "only" })], 2, now)).toThrow(
      "Not enough available questions for a 2 question session",
    );
  });
});
