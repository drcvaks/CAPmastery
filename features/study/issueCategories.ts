export const issueCategories = {
  answer: "Answer",
  explanation: "Explanation",
  source: "Source",
  image: "Image",
  mnemonic: "Mnemonic",
  wording: "Wording or typo",
  other: "Other",
} as const;

export type IssueCategory = keyof typeof issueCategories;
