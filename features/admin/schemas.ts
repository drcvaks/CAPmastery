import { z } from "zod";

export const importIssueSchema = z.object({
  row: z.number().int().positive().optional(),
  external_id: z.string().optional(),
  message: z.string().min(1),
});

export const importJobSchema = z.object({
  id: z.uuid(),
  file_name: z.string().min(1),
  rows_received: z.number().int().nonnegative(),
  rows_accepted: z.number().int().nonnegative(),
  rows_rejected: z.number().int().nonnegative(),
  error_report: z.array(importIssueSchema),
  warning_report: z.array(importIssueSchema),
  status: z.enum(["validating", "failed", "completed"]),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});

export const duplicateWarningSchema = z.object({
  row_number: z.number().int().positive(),
  external_id: z.string().nullable(),
  warning: z.string().min(1),
});

export const reviewQueueItemSchema = z.object({
  question_id: z.uuid(),
  external_id: z.string().nullable(),
  question_text: z.string().min(1),
  exam_title: z.string().min(1),
  topic_title: z.string().min(1),
  review_status: z.enum(["draft", "in_review", "approved", "rejected", "archived"]),
  version: z.number().int().positive(),
  updated_at: z.string(),
});

const reviewChoiceSchema = z.object({
  id: z.uuid(),
  key: z.string().regex(/^[A-D]$/),
  text: z.string().min(1),
  sort_order: z.number().int().nonnegative(),
  feedback: z.string().nullable(),
});

export const reviewQuestionSchema = z.object({
  question: z
    .object({
      id: z.uuid(),
      external_id: z.string().nullable(),
      question_text: z.string().min(1),
      difficulty: z.enum(["easy", "medium", "hard"]),
      cognitive_level: z.enum(["recall", "understanding", "application", "scenario"]),
      source_reference: z.string().nullable(),
      source_page_start: z.number().int().positive().nullable(),
      source_page_end: z.number().int().positive().nullable(),
      estimated_time_seconds: z.number().int().positive().nullable(),
      chapter_number: z.number().int().positive().nullable(),
      exam_likeness: z.enum(["high", "medium", "low"]).nullable(),
      distractor_difficulty: z.enum(["basic", "moderate", "close"]).nullable(),
      eligible_for_final_exam: z.boolean(),
      final_exam_weight: z.number().nonnegative(),
      content_origin: z.enum(["existing_original_bank", "original_textbook_grounded"]).nullable(),
      style_reference: z
        .enum(["pre_sample_bank_review", "Mitchell_sample_style_analysis"])
        .nullable(),
      review_status: z.enum(["draft", "in_review", "approved", "rejected", "archived"]),
      version: z.number().int().positive(),
    })
    .passthrough(),
  choices: z.array(reviewChoiceSchema).length(4),
  answer: z.object({
    correct_choice_id: z.uuid(),
    explanation: z.string().min(1),
    remediation: z.string().nullable(),
    common_mistake: z.string().nullable(),
  }),
  learning_support: z.unknown().nullable(),
});

export type ImportJob = z.infer<typeof importJobSchema>;
export type DuplicateWarning = z.infer<typeof duplicateWarningSchema>;
export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>;
export type ReviewQuestion = z.infer<typeof reviewQuestionSchema>;

export type ReviewEditPayload = {
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  cognitive_level: "recall" | "understanding" | "application" | "scenario";
  source_reference: string;
  source_page_start: string;
  source_page_end: string;
  estimated_time_seconds: string;
  chapter_number: string;
  exam_likeness: "" | "high" | "medium" | "low";
  distractor_difficulty: "" | "basic" | "moderate" | "close";
  eligible_for_final_exam: boolean;
  final_exam_weight: string;
  content_origin: "" | "existing_original_bank" | "original_textbook_grounded";
  style_reference: "" | "pre_sample_bank_review" | "Mitchell_sample_style_analysis";
  choices: { key: string; text: string; feedback: string }[];
  correct_letter: string;
  explanation: string;
  remediation: string;
  common_mistake: string;
};
