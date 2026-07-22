import { z } from "zod";

const score = z.number().min(0).max(100);

export const progressStudentSchema = z.object({
  student_id: z.uuid(),
  display_name: z.string().min(1),
});

export const progressOverviewSchema = z.object({
  student_id: z.uuid(),
  student_name: z.string().min(1),
  exam_id: z.uuid(),
  exam_title: z.string().min(1),
  eligible_question_count: z.number().int().nonnegative(),
  attempted_question_count: z.number().int().nonnegative(),
  topic_count: z.number().int().nonnegative(),
  practiced_topic_count: z.number().int().nonnegative(),
  coverage_score: score,
  recent_accuracy_score: score,
  mastery_score: score,
  retention_score: score,
  weak_topic_count: z.number().int().nonnegative(),
  due_question_count: z.number().int().nonnegative(),
  readiness_score: score,
  readiness_label: z.enum([
    "Not started",
    "Developing",
    "Getting Close",
    "Practice-Test Ready",
    "Strong Readiness",
  ]),
  recommended_topic_id: z.uuid().nullable(),
  recommended_topic_title: z.string().nullable(),
  recommended_action: z.string().min(1),
});

export const topicProgressSchema = z.object({
  topic_id: z.uuid(),
  topic_title: z.string().min(1),
  eligible_question_count: z.number().int().nonnegative(),
  attempted_question_count: z.number().int().nonnegative(),
  attempts_count: z.number().int().nonnegative(),
  correct_count: z.number().int().nonnegative(),
  accuracy_score: score,
  mastery_score: score,
  confidence_score: score,
  retention_score: score,
  status: z.enum([
    "not_started",
    "beginning",
    "developing",
    "proficient",
    "mastered",
    "needs_review",
  ]),
  due_question_count: z.number().int().nonnegative(),
  last_practiced_at: z.iso.datetime({ offset: true }).nullable(),
  next_review_at: z.iso.datetime({ offset: true }).nullable(),
  recommended: z.boolean(),
});

export const progressTrendSchema = z.object({
  trend_date: z.iso.date(),
  questions_answered: z.number().int().positive(),
  correct_count: z.number().int().nonnegative(),
  accuracy_score: score,
});

export type ProgressStudent = z.infer<typeof progressStudentSchema>;
export type ProgressOverview = z.infer<typeof progressOverviewSchema>;
export type TopicProgress = z.infer<typeof topicProgressSchema>;
export type ProgressTrend = z.infer<typeof progressTrendSchema>;
export type ExamProgress = ProgressOverview & {
  topics: TopicProgress[];
  trends: ProgressTrend[];
};
