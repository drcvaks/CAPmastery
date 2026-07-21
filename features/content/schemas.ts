import { z } from "zod";

import type { Database } from "../../types/database";

type ApprovedQuestionRow =
  Database["public"]["Functions"]["get_approved_questions"]["Returns"][number];

const choiceSchema = z
  .object({
    id: z.uuid(),
    key: z.string().regex(/^[A-Z]$/),
    text: z.string().min(1),
    sortOrder: z.number().int().nonnegative(),
  })
  .strict();

export type ApprovedQuestionPreview = Omit<ApprovedQuestionRow, "choices"> & {
  choices: z.infer<typeof choiceSchema>[];
};

export function parseApprovedQuestionRows(rows: ApprovedQuestionRow[]): ApprovedQuestionPreview[] {
  return rows.map(({ choices, ...question }) => ({
    ...question,
    choices: z.array(choiceSchema).parse(choices),
  }));
}
