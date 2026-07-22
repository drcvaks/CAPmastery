import {
  selectPracticeBlueprintQuestions,
  SparsePracticeBlueprintError,
  type PracticeBlueprintRule,
  type PracticeCandidate,
} from "../features/practice/blueprint";

const rules: PracticeBlueprintRule[] = [
  { difficulty: "easy", cognitiveLevel: "recall", targetCount: 2 },
  { difficulty: "medium", cognitiveLevel: "understanding", targetCount: 2 },
  { difficulty: "hard", cognitiveLevel: "scenario", targetCount: 1 },
];
const candidates: PracticeCandidate[] = rules.flatMap((rule, ruleIndex) =>
  Array.from({ length: 6 }, (_, index) => ({
    id: `${ruleIndex}-${index}`,
    topicId: index % 2 === 0 ? "alpha" : "bravo",
    difficulty: rule.difficulty,
    cognitiveLevel: rule.cognitiveLevel,
  })),
);

describe("practice-test blueprint selection", () => {
  it("meets every fixed rule without duplicate questions", () => {
    const selected = selectPracticeBlueprintQuestions(candidates, rules, "pilot-seed");

    expect(selected).toHaveLength(5);
    expect(new Set(selected.map(({ id }) => id)).size).toBe(5);
    for (const rule of rules) {
      expect(
        selected.filter(
          (question) =>
            question.difficulty === rule.difficulty &&
            question.cognitiveLevel === rule.cognitiveLevel,
        ),
      ).toHaveLength(rule.targetCount);
    }
  });

  it("is repeatable for the same seed and balances available topics", () => {
    const first = selectPracticeBlueprintQuestions(candidates, rules, "same-seed");
    const replay = selectPracticeBlueprintQuestions(candidates, rules, "same-seed");

    expect(replay).toEqual(first);
    expect(new Set(first.map(({ topicId }) => topicId))).toEqual(new Set(["alpha", "bravo"]));
  });

  it("fails clearly when a required blueprint stratum is sparse", () => {
    expect(() =>
      selectPracticeBlueprintQuestions(candidates.slice(1), [rules[0]!], "sparse"),
    ).not.toThrow();
    expect(() =>
      selectPracticeBlueprintQuestions(candidates.slice(6), [rules[0]!], "sparse"),
    ).toThrow(SparsePracticeBlueprintError);
  });
});
