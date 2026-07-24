export type PositiveChallengeScore = {
  accuracyPoints: number;
  completionPoints: number;
  improvementPercent: number | null;
  improvementPoints: number;
  totalPoints: number;
};

export function calculatePositiveChallengeScore(
  scorePercent: number,
  baselineAccuracy: number | null,
): PositiveChallengeScore {
  const score = Math.max(0, Math.min(100, scorePercent));
  const improvement =
    baselineAccuracy === null
      ? null
      : Math.round((score - Math.max(0, Math.min(100, baselineAccuracy))) * 100) / 100;
  const accuracyPoints = Math.max(0, Math.min(40, Math.round(score * 0.4)));
  const improvementPoints =
    improvement === null ? 0 : Math.max(0, Math.min(20, Math.round(improvement)));
  return {
    accuracyPoints,
    completionPoints: 40,
    improvementPercent: improvement,
    improvementPoints,
    totalPoints: 40 + accuracyPoints + improvementPoints,
  };
}
