import { calculatePositiveChallengeScore } from "../features/challenges/scoring";

describe("positive challenge scoring", () => {
  it("rewards completion, accuracy, and improvement without ranking students", () => {
    expect(calculatePositiveChallengeScore(66.67, 20)).toEqual({
      accuracyPoints: 27,
      completionPoints: 40,
      improvementPercent: 46.67,
      improvementPoints: 20,
      totalPoints: 87,
    });
  });

  it("treats a first result as baseline building", () => {
    expect(calculatePositiveChallengeScore(50, null)).toEqual({
      accuracyPoints: 20,
      completionPoints: 40,
      improvementPercent: null,
      improvementPoints: 0,
      totalPoints: 60,
    });
  });

  it("clamps out-of-range inputs and never subtracts points for a setback", () => {
    expect(calculatePositiveChallengeScore(-10, 120)).toEqual({
      accuracyPoints: 0,
      completionPoints: 40,
      improvementPercent: -100,
      improvementPoints: 0,
      totalPoints: 40,
    });
  });
});
