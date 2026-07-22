export type PracticeDifficulty = "easy" | "medium" | "hard";
export type PracticeCognitiveLevel = "recall" | "understanding" | "application" | "scenario";

export type PracticeBlueprintRule = {
  difficulty: PracticeDifficulty;
  cognitiveLevel: PracticeCognitiveLevel;
  targetCount: number;
};

export type PracticeCandidate = {
  id: string;
  topicId: string;
  difficulty: PracticeDifficulty;
  cognitiveLevel: PracticeCognitiveLevel;
};

export class SparsePracticeBlueprintError extends Error {}

export function selectPracticeBlueprintQuestions(
  candidates: PracticeCandidate[],
  rules: PracticeBlueprintRule[],
  seed: string,
): PracticeCandidate[] {
  if (
    !rules.length ||
    rules.some((rule) => !Number.isInteger(rule.targetCount) || rule.targetCount < 1)
  ) {
    throw new Error("Practice blueprint rules require positive integer targets.");
  }

  const selected: PracticeCandidate[] = [];
  const selectedIds = new Set<string>();

  for (const rule of rules) {
    const matching = candidates.filter(
      (candidate) =>
        candidate.difficulty === rule.difficulty &&
        candidate.cognitiveLevel === rule.cognitiveLevel &&
        !selectedIds.has(candidate.id),
    );
    const balanced = balanceAcrossTopics(matching, seed);
    if (balanced.length < rule.targetCount) {
      throw new SparsePracticeBlueprintError(
        `Not enough ${rule.difficulty} ${rule.cognitiveLevel} questions for the practice blueprint.`,
      );
    }
    for (const candidate of balanced.slice(0, rule.targetCount)) {
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  return [...selected].sort(
    (left, right) =>
      stableHash(`${seed}:position:${left.id}`) - stableHash(`${seed}:position:${right.id}`),
  );
}

function balanceAcrossTopics(candidates: PracticeCandidate[], seed: string): PracticeCandidate[] {
  const byTopic = new Map<string, PracticeCandidate[]>();
  for (const candidate of candidates) {
    const topic = byTopic.get(candidate.topicId) ?? [];
    topic.push(candidate);
    byTopic.set(candidate.topicId, topic);
  }

  const topics = [...byTopic.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([topicId, topicCandidates]) => ({
      topicId,
      candidates: topicCandidates.sort(
        (left, right) =>
          stableHash(`${seed}:candidate:${left.id}`) - stableHash(`${seed}:candidate:${right.id}`),
      ),
    }));
  const balanced: PracticeCandidate[] = [];
  const largestTopic = Math.max(0, ...topics.map(({ candidates: values }) => values.length));
  for (let rank = 0; rank < largestTopic; rank += 1) {
    for (const topic of topics) {
      const candidate = topic.candidates[rank];
      if (candidate) balanced.push(candidate);
    }
  }
  return balanced;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
