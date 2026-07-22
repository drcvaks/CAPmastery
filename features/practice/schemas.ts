import { z } from "zod";

export const practiceTestOptionSchema = z
  .object({
    blueprint_id: z.uuid(),
    exam_id: z.uuid(),
    exam_title: z.string().min(1),
    blueprint_name: z.string().min(1),
    description: z.string().min(1),
    question_count: z.number().int().positive(),
    time_limit_seconds: z.number().int().positive(),
    allow_untimed: z.boolean(),
    allow_pause: z.boolean(),
  })
  .strict();

export const practiceTopicResultSchema = z
  .object({
    topic_id: z.uuid(),
    topic_title: z.string().min(1),
    question_count: z.number().int().positive(),
    answered_count: z.number().int().nonnegative(),
    correct_count: z.number().int().nonnegative(),
    score_percent: z.number().min(0).max(100),
    performance_label: z.enum(["Strength", "Developing", "Review next", "Not attempted"]),
  })
  .strict();

export type PracticeTestOption = z.infer<typeof practiceTestOptionSchema>;
export type PracticeTopicResult = z.infer<typeof practiceTopicResultSchema>;
