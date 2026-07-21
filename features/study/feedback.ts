const DEFAULT_WORD_BUDGET = 35;
const INCORRECT_CHOICE_BUDGET = 20;

function words(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean);
}

function normalize(text: string) {
  return text
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function conceptTokens(text: string) {
  const ignored = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "with",
  ]);
  return new Set(
    normalize(text)
      .split(" ")
      .filter((token) => token && !ignored.has(token)),
  );
}

export function explanationsOverlap(first: string, second: string) {
  const normalizedFirst = normalize(first);
  const normalizedSecond = normalize(second);
  if (!normalizedFirst || !normalizedSecond) return false;
  if (normalizedFirst.includes(normalizedSecond) || normalizedSecond.includes(normalizedFirst)) {
    return true;
  }

  const firstTokens = conceptTokens(first);
  const secondTokens = conceptTokens(second);
  const smallerSize = Math.min(firstTokens.size, secondTokens.size);
  if (smallerSize === 0) return false;
  const shared = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return shared / smallerSize >= 0.7;
}

export function shortenExplanation(text: string, maxWords = DEFAULT_WORD_BUDGET, maxSentences = 2) {
  const clean = text.replace(/\s+/gu, " ").trim();
  if (!clean) return "";
  const sentences = clean.split(/(?<=[.!?])\s+/u).slice(0, maxSentences);
  const selected: string[] = [];
  let usedWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = words(sentence);
    if (usedWords + sentenceWords.length <= maxWords) {
      selected.push(sentence);
      usedWords += sentenceWords.length;
      continue;
    }
    if (selected.length === 0) {
      selected.push(
        `${sentenceWords
          .slice(0, maxWords)
          .join(" ")
          .replace(/[.,;:!?]+$/u, "")}…`,
      );
    }
    break;
  }

  return selected.join(" ");
}

export type AnswerFeedback = {
  title: "Correct." | "Not quite.";
  primary: string;
  correctConcept?: string;
};

export function buildAnswerFeedback({
  isCorrect,
  explanation,
  selectedChoiceFeedback,
}: {
  isCorrect: boolean;
  explanation: string | null;
  selectedChoiceFeedback: string | null;
}): AnswerFeedback {
  const main = explanation?.trim() || "Feedback is unavailable.";
  if (isCorrect) {
    return {
      title: "Correct.",
      primary: shortenExplanation(main),
    };
  }

  const selected = selectedChoiceFeedback?.trim();
  if (!selected) {
    return {
      title: "Not quite.",
      primary: shortenExplanation(main),
    };
  }

  const alreadyClear = explanationsOverlap(selected, main);
  const primaryBudget = alreadyClear ? DEFAULT_WORD_BUDGET : INCORRECT_CHOICE_BUDGET;
  const primary = shortenExplanation(selected, primaryBudget, 1);
  if (alreadyClear) return { title: "Not quite.", primary };

  const remainingWords = Math.max(DEFAULT_WORD_BUDGET - words(primary).length - 1, 10);
  return {
    title: "Not quite.",
    primary,
    correctConcept: shortenExplanation(main, remainingWords, 1),
  };
}
