import { z } from "zod";

export const practiceTestOptionSchema = z
  .object({
    blueprint_id: z.uuid(),
    blueprint_code: z.string().min(1),
    selection_strategy: z.enum(["fixed_blueprint", "mitchell_full_exam"]),
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

export const practiceWeakAreaSchema = z
  .object({
    chapter_number: z.number().int().positive(),
    chapter_title: z.string().min(1),
    objective_id: z.uuid(),
    objective_code: z.string().min(1),
    objective_title: z.string().min(1),
    concept_titles: z.array(z.string().min(1)),
    question_count: z.number().int().positive(),
    answered_count: z.number().int().nonnegative(),
    correct_count: z.number().int().nonnegative(),
    score_percent: z.number().min(0).max(100),
  })
  .strict();

export const practiceReviewProgressSchema = z
  .object({
    session_id: z.uuid(),
    tracking_available: z.boolean(),
    missed_count: z.number().int().nonnegative(),
    reviewed_count: z.number().int().nonnegative(),
    review_percent: z.number().int().min(0).max(100).nullable(),
    review_complete: z.boolean(),
    reviewed_session_question_ids: z.array(z.uuid()),
  })
  .strict();

export type PracticeTestOption = z.infer<typeof practiceTestOptionSchema>;
export type PracticeTopicResult = z.infer<typeof practiceTopicResultSchema>;
export type PracticeWeakArea = z.infer<typeof practiceWeakAreaSchema>;
export type PracticeReviewProgress = z.infer<typeof practiceReviewProgressSchema>;
