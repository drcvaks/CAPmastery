import {
  calculateReadiness,
  READINESS_DISCLAIMER,
  readinessCoverageCap,
  readinessLabel,
} from "../features/progress/readiness";

describe("readiness calculation", () => {
  it("shows zero and not started before the first answer", () => {
    expect(
      calculateReadiness({
        eligibleQuestionCount: 30,
        attemptedQuestionCount: 0,
        recentAccuracy: 0,
        masteryScore: 40,
        retentionScore: 0,
        weakTopicCount: 0,
        topicCount: 5,
      }),
    ).toMatchObject({ readinessScore: 0, label: "Not started" });
  });

  it("prevents a few perfect answers from producing high readiness", () => {
    const result = calculateReadiness({
      eligibleQuestionCount: 30,
      attemptedQuestionCount: 5,
      recentAccuracy: 100,
      masteryScore: 100,
      retentionScore: 100,
      weakTopicCount: 0,
      topicCount: 5,
    });

    expect(result.coverageCap).toBe(40);
    expect(result.readinessScore).toBe(40);
    expect(result.label).toBe("Developing");
  });

  it("applies increasing minimum evidence and coverage caps", () => {
    expect(readinessCoverageCap(9, 100)).toBe(40);
    expect(readinessCoverageCap(10, 49)).toBe(65);
    expect(readinessCoverageCap(20, 69)).toBe(79);
    expect(readinessCoverageCap(30, 70)).toBe(100);
  });

  it("penalizes weak topics without producing negative scores", () => {
    const strong = calculateReadiness({
      eligibleQuestionCount: 30,
      attemptedQuestionCount: 30,
      recentAccuracy: 90,
      masteryScore: 90,
      retentionScore: 85,
      weakTopicCount: 0,
      topicCount: 3,
    });
    const weak = calculateReadiness({
      eligibleQuestionCount: 30,
      attemptedQuestionCount: 30,
      recentAccuracy: 90,
      masteryScore: 90,
      retentionScore: 85,
      weakTopicCount: 2,
      topicCount: 3,
    });

    expect(weak.readinessScore).toBeLessThan(strong.readinessScore);
    expect(
      calculateReadiness({
        eligibleQuestionCount: 0,
        attemptedQuestionCount: 0,
        recentAccuracy: 0,
        masteryScore: 0,
        retentionScore: 0,
        weakTopicCount: 0,
        topicCount: 0,
      }).readinessScore,
    ).toBe(0);
  });

  it("uses supportive labels and the required unofficial disclaimer", () => {
    expect([49, 50, 70, 85].map(readinessLabel)).toEqual([
      "Developing",
      "Getting Close",
      "Practice-Test Ready",
      "Strong Readiness",
    ]);
    expect(READINESS_DISCLAIMER).toBe("This is a study estimate, not an official CAP result.");
  });
});
