export const ADAPTIVE_BUCKET_WEIGHTS = {
  weak_topic: 0.4,
  recently_missed: 0.2,
  developing_topic: 0.2,
  retention_check: 0.1,
  new_or_harder: 0.1,
} as const;

export type AdaptiveBucket = keyof typeof ADAPTIVE_BUCKET_WEIGHTS;
export type MasteryStatus =
  "not_started" | "beginning" | "developing" | "proficient" | "mastered" | "needs_review";

export type MasterySnapshot = {
  attemptsCount: number;
  correctCount: number;
  recentAccuracy: number;
  masteryScore: number;
  confidenceScore: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  lastPracticedAt: Date | null;
};

export type MasteryUpdateInput = {
  previous?: MasterySnapshot;
  correct: boolean;
  difficulty: "easy" | "medium" | "hard";
  cognitiveLevel: "recall" | "understanding" | "application" | "scenario";
  confidence?: number;
  now: Date;
};

export type MasteryUpdate = MasterySnapshot & {
  status: MasteryStatus;
  retentionScore: number;
  intervalDays: number;
  nextReviewAt: Date;
};

export type AdaptiveCandidate = {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  timesSeen: number;
  lastResult: boolean | null;
  lastSeenAt: Date | null;
  nextReviewAt: Date | null;
  topicAttempts: number;
  topicMastery: number;
  topicStatus: MasteryStatus;
};

export type AdaptiveSelection = AdaptiveCandidate & { selectionReason: AdaptiveBucket };

const INITIAL_MASTERY = 40;
const INITIAL_CONFIDENCE = 0;
const DAY_MS = 86_400_000;

export function calculateReviewInterval(correct: boolean, consecutiveCorrect: number): number {
  if (!correct) return 1;
  if (consecutiveCorrect <= 1) return 2;
  if (consecutiveCorrect === 2) return 5;
  if (consecutiveCorrect === 3) return 10;
  return Math.min(60, Math.round(10 * 1.7 ** (consecutiveCorrect - 3)));
}

export function calculateRetentionScore(
  masteryScore: number,
  confidenceScore: number,
  lastPracticedAt: Date | null,
  now: Date,
): number {
  if (!lastPracticedAt) return 0;
  const elapsedDays = Math.max(0, (now.getTime() - lastPracticedAt.getTime()) / DAY_MS);
  const decay = Math.min(35, elapsedDays * (1.25 - confidenceScore / 200));
  return round(clamp(masteryScore - decay, 0, 100));
}

export function updateMastery(input: MasteryUpdateInput): MasteryUpdate {
  const previous = input.previous ?? {
    attemptsCount: 0,
    correctCount: 0,
    recentAccuracy: 40,
    masteryScore: INITIAL_MASTERY,
    confidenceScore: INITIAL_CONFIDENCE,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    lastPracticedAt: null,
  };
  const consecutiveCorrect = input.correct ? previous.consecutiveCorrect + 1 : 0;
  const consecutiveIncorrect = input.correct ? 0 : previous.consecutiveIncorrect + 1;
  const difficultyDelta = input.correct
    ? { easy: 5, medium: 7, hard: 9 }[input.difficulty]
    : { easy: -10, medium: -8, hard: -6 }[input.difficulty];
  const cognitiveDelta =
    input.correct && ["application", "scenario"].includes(input.cognitiveLevel) ? 2 : 0;
  const confidence = input.confidence ?? 3;
  const confidenceFactor = input.correct && confidence <= 2 ? 0.7 : 1;
  const misconceptionPenalty = !input.correct && confidence >= 4 ? -2 : 0;
  const masteryScore = round(
    clamp(
      previous.masteryScore +
        (difficultyDelta + cognitiveDelta) * confidenceFactor +
        misconceptionPenalty,
      0,
      100,
    ),
  );
  const attemptsCount = previous.attemptsCount + 1;
  const correctCount = previous.correctCount + (input.correct ? 1 : 0);
  const recentAccuracy = round(previous.recentAccuracy * 0.75 + (input.correct ? 25 : 0));
  const confidenceScore = round(
    clamp(
      previous.confidenceScore + (input.correct ? 10 : 6) + (consecutiveCorrect >= 2 ? 3 : 0),
      0,
      100,
    ),
  );
  const intervalDays = calculateReviewInterval(input.correct, consecutiveCorrect);
  const nextReviewAt = new Date(input.now.getTime() + intervalDays * DAY_MS);
  const status = masteryStatus(masteryScore, attemptsCount, consecutiveIncorrect);

  return {
    attemptsCount,
    correctCount,
    recentAccuracy,
    masteryScore,
    confidenceScore,
    consecutiveCorrect,
    consecutiveIncorrect,
    lastPracticedAt: input.now,
    retentionScore: calculateRetentionScore(masteryScore, confidenceScore, input.now, input.now),
    intervalDays,
    nextReviewAt,
    status,
  };
}

export function masteryStatus(
  score: number,
  attemptsCount: number,
  consecutiveIncorrect: number,
): MasteryStatus {
  if (attemptsCount === 0) return "not_started";
  if (consecutiveIncorrect >= 2) return "needs_review";
  if (score < 35) return "beginning";
  if (score < 60) return "developing";
  if (score < 80) return "proficient";
  return "mastered";
}

export function allocateAdaptiveBuckets(targetCount: number): Record<AdaptiveBucket, number> {
  if (!Number.isInteger(targetCount) || targetCount < 1) {
    throw new Error("Target count must be a positive integer");
  }
  const buckets = Object.keys(ADAPTIVE_BUCKET_WEIGHTS) as AdaptiveBucket[];
  const allocation = Object.fromEntries(
    buckets.map((bucket) => [bucket, Math.floor(targetCount * ADAPTIVE_BUCKET_WEIGHTS[bucket])]),
  ) as Record<AdaptiveBucket, number>;
  let remaining = targetCount - Object.values(allocation).reduce((sum, value) => sum + value, 0);
  for (const bucket of buckets) {
    if (remaining === 0) break;
    allocation[bucket] += 1;
    remaining -= 1;
  }
  return allocation;
}

export function selectAdaptiveQuestions(
  candidates: AdaptiveCandidate[],
  targetCount: number,
  now: Date,
  seed = "cap-mastery",
): AdaptiveSelection[] {
  if (candidates.length < targetCount) {
    throw new Error(`Not enough available questions for a ${targetCount} question session`);
  }
  const allocation = allocateAdaptiveBuckets(targetCount);
  const classified = candidates.map((candidate) => ({
    ...candidate,
    selectionReason: classifyCandidate(candidate, now),
  }));
  const chosen: AdaptiveSelection[] = [];
  const used = new Set<string>();

  for (const bucket of Object.keys(allocation) as AdaptiveBucket[]) {
    const matches = classified
      .filter((candidate) => candidate.selectionReason === bucket)
      .sort((left, right) => compareCandidates(left, right, now, seed));
    for (const candidate of matches.slice(0, allocation[bucket])) {
      chosen.push(candidate);
      used.add(candidate.id);
    }
  }

  const fallback = classified
    .filter((candidate) => !used.has(candidate.id))
    .sort((left, right) => compareCandidates(left, right, now, seed));
  chosen.push(...fallback.slice(0, targetCount - chosen.length));
  return chosen;
}

function classifyCandidate(candidate: AdaptiveCandidate, now: Date): AdaptiveBucket {
  if (
    candidate.lastResult === false &&
    (!candidate.nextReviewAt || candidate.nextReviewAt.getTime() <= now.getTime())
  ) {
    return "recently_missed";
  }
  if (
    candidate.topicStatus === "needs_review" ||
    candidate.topicStatus === "beginning" ||
    (candidate.topicAttempts > 0 && candidate.topicMastery < 40)
  ) {
    return "weak_topic";
  }
  if (
    candidate.topicStatus === "developing" ||
    (candidate.topicAttempts > 0 && candidate.topicMastery < 60)
  ) {
    return "developing_topic";
  }
  if (
    candidate.topicMastery >= 60 &&
    candidate.nextReviewAt !== null &&
    candidate.nextReviewAt.getTime() <= now.getTime()
  ) {
    return "retention_check";
  }
  return "new_or_harder";
}

function compareCandidates(
  left: AdaptiveSelection,
  right: AdaptiveSelection,
  now: Date,
  seed: string,
): number {
  const recentCooldown = 12 * 60 * 60 * 1000;
  const leftRecent = left.lastSeenAt && now.getTime() - left.lastSeenAt.getTime() < recentCooldown;
  const rightRecent =
    right.lastSeenAt && now.getTime() - right.lastSeenAt.getTime() < recentCooldown;
  if (Boolean(leftRecent) !== Boolean(rightRecent)) return leftRecent ? 1 : -1;
  if (left.timesSeen !== right.timesSeen) return left.timesSeen - right.timesSeen;
  const leftSeen = left.lastSeenAt?.getTime() ?? 0;
  const rightSeen = right.lastSeenAt?.getTime() ?? 0;
  if (leftSeen !== rightSeen) return leftSeen - rightSeen;
  return stableHash(`${seed}:${left.id}`) - stableHash(`${seed}:${right.id}`);
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
