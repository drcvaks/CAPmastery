export type ReadinessLabel =
  "Not started" | "Developing" | "Getting Close" | "Practice-Test Ready" | "Strong Readiness";

export type ReadinessInput = {
  eligibleQuestionCount: number;
  attemptedQuestionCount: number;
  recentAccuracy: number;
  masteryScore: number;
  retentionScore: number;
  practiceTestScore?: number | null;
  weakTopicCount: number;
  topicCount: number;
};

export type ReadinessResult = {
  coverageScore: number;
  coverageCap: number;
  readinessScore: number;
  label: ReadinessLabel;
};

export const READINESS_DISCLAIMER = "This is a study estimate, not an official CAP result.";

export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  const eligible = Math.max(0, input.eligibleQuestionCount);
  const attempted = Math.max(0, Math.min(input.attemptedQuestionCount, eligible));
  const coverageScore = eligible === 0 ? 0 : round((attempted / eligible) * 100);
  const coverageCap = readinessCoverageCap(attempted, coverageScore);
  if (attempted === 0) {
    return { coverageScore, coverageCap, readinessScore: 0, label: "Not started" };
  }
  const weakPenalty =
    input.topicCount > 0
      ? Math.min(15, (Math.max(0, input.weakTopicCount) / input.topicCount) * 15)
      : 0;
  const weighted =
    input.practiceTestScore === null || input.practiceTestScore === undefined
      ? coverageScore * 0.15 +
        clamp(input.recentAccuracy) * 0.3 +
        clamp(input.masteryScore) * 0.35 +
        clamp(input.retentionScore) * 0.2 -
        weakPenalty
      : coverageScore * 0.15 +
        clamp(input.recentAccuracy) * 0.2 +
        clamp(input.masteryScore) * 0.25 +
        clamp(input.retentionScore) * 0.15 +
        clamp(input.practiceTestScore) * 0.25 -
        weakPenalty;
  const readinessScore = round(Math.min(coverageCap, clamp(weighted)));

  return {
    coverageScore,
    coverageCap,
    readinessScore,
    label: readinessLabel(readinessScore),
  };
}

export function readinessCoverageCap(
  attemptedQuestionCount: number,
  coverageScore: number,
): number {
  if (attemptedQuestionCount < 10 || coverageScore < 20) return 40;
  if (attemptedQuestionCount < 20 || coverageScore < 50) return 65;
  if (attemptedQuestionCount < 30 || coverageScore < 70) return 79;
  return 100;
}

export function readinessLabel(score: number): ReadinessLabel {
  if (score < 50) return "Developing";
  if (score < 70) return "Getting Close";
  if (score < 85) return "Practice-Test Ready";
  return "Strong Readiness";
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
