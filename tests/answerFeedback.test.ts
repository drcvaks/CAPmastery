import {
  buildAnswerFeedback,
  explanationsOverlap,
  shortenExplanation,
} from "../features/study/feedback";

describe("answer feedback formatting", () => {
  it("shows only a concise main explanation for a correct answer", () => {
    const result = buildAnswerFeedback({
      isCorrect: true,
      explanation:
        "Faithful service means being true and dependable in carrying out a commitment. This additional sentence gives detail that is not needed by default. A third sentence must also remain hidden.",
      shortExplanation: "Faithful service means staying dependable and keeping your commitment.",
      selectedChoiceFeedback:
        "Faithful service means being true and dependable in carrying out a commitment.",
    });

    expect(result.title).toBe("Correct.");
    expect(result.primary).toBe(
      "Faithful service means staying dependable and keeping your commitment.",
    );
    expect(result.correctConcept).toBeUndefined();
  });

  it("starts an incorrect result with selected-choice feedback", () => {
    const result = buildAnswerFeedback({
      isCorrect: false,
      explanation: "An oath is a solemn public promise involving duty and accountability.",
      shortExplanation: "An oath is a serious public promise.",
      selectedChoiceFeedback:
        "An oath is made by the person taking it, not ordered by someone else.",
    });

    expect(result.title).toBe("Not quite.");
    expect(result.primary).toContain("not ordered by someone else");
    expect(result.correctConcept).toContain("serious public promise");
  });

  it("does not repeat a correct concept already present in selected-choice feedback", () => {
    const explanation = "An oath is a solemn public promise involving duty and accountability.";
    const result = buildAnswerFeedback({
      isCorrect: false,
      explanation,
      selectedChoiceFeedback: explanation,
    });

    expect(result.primary).toBe(explanation);
    expect(result.correctConcept).toBeUndefined();
  });

  it("keeps default feedback within the intended word budget", () => {
    const longText = Array.from({ length: 50 }, (_, index) => `word${index}`).join(" ");

    expect(shortenExplanation(longText).split(/\s+/u)).toHaveLength(35);
  });

  it("recognizes punctuation-only and strongly overlapping duplicates", () => {
    expect(
      explanationsOverlap("Service means helping the team.", "Service means helping the team"),
    ).toBe(true);
  });
});
