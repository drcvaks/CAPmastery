import { z } from "zod";

const choiceSchema = z
  .object({
    id: z.uuid(),
    key: z.string().regex(/^[A-Z]$/),
    text: z.string().min(1),
    sortOrder: z.number().int().nonnegative(),
  })
  .strict();

const sessionQuestionRowSchema = z.object({
  session_id: z.uuid(),
  session_mode: z.enum(["study", "practice_test"]),
  session_status: z.enum(["active", "completed", "abandoned"]),
  question_count: z.number().int().positive(),
  answered_count: z.number().int().nonnegative(),
  correct_count: z.number().int().nonnegative(),
  timed: z.boolean(),
  time_limit_seconds: z.number().int().positive().nullable(),
  allow_pause: z.boolean(),
  is_paused: z.boolean(),
  remaining_seconds: z.number().int().nonnegative().nullable(),
  feedback_released: z.boolean(),
  session_question_id: z.uuid(),
  question_position: z.number().int().positive(),
  question_id: z.uuid(),
  question_text: z.string().min(1),
  question_type: z.enum(["multiple_choice", "true_false"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  cognitive_level: z.enum(["recall", "understanding", "application", "scenario"]),
  source_reference: z.string().min(1),
  choices: z.array(choiceSchema).min(2),
  attempt_id: z.uuid().nullable(),
  selected_choice_id: z.uuid().nullable(),
  is_correct: z.boolean().nullable(),
  correct_choice_id: z.uuid().nullable(),
  explanation: z.string().nullable(),
  selected_choice_feedback: z.string().nullable(),
  remediation: z.string().nullable(),
  common_mistake: z.string().nullable(),
  short_explanation: z.string().nullable(),
  feedback_display_version: z.number().int().positive().nullable(),
  memory_aid: z.string().nullable(),
  visual_asset_key: z.string().nullable(),
  visual_caption: z.string().nullable(),
  visual_alt_text: z.string().nullable(),
  visual_storage_path: z.string().nullable(),
  visual_mime_type: z.string().nullable(),
  visual_width: z.number().int().positive().nullable(),
  visual_height: z.number().int().positive().nullable(),
  visual_uri: z.url().nullable(),
});

const submissionSchema = z.object({
  attempt_id: z.uuid(),
  is_correct: z.boolean().nullable(),
  correct_choice_id: z.uuid().nullable(),
  explanation: z.string().min(1).nullable(),
  selected_choice_feedback: z.string().nullable(),
  remediation: z.string().nullable(),
  common_mistake: z.string().nullable(),
  source_reference: z.string().min(1).nullable(),
  session_completed: z.boolean(),
  answered_count: z.number().int().positive(),
  question_count: z.number().int().positive(),
  correct_count: z.number().int().nonnegative(),
});

export type StudyChoice = z.infer<typeof choiceSchema>;
export type StudyQuestion = z.infer<typeof sessionQuestionRowSchema>;
export type AnswerSubmission = z.infer<typeof submissionSchema>;

export type StudySession = {
  id: string;
  mode: StudyQuestion["session_mode"];
  status: StudyQuestion["session_status"];
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  timed: boolean;
  timeLimitSeconds: number | null;
  allowPause: boolean;
  isPaused: boolean;
  remainingSeconds: number | null;
  feedbackReleased: boolean;
  questions: StudyQuestion[];
};

export function parseStudySessionRows(rows: unknown[]): StudySession {
  const questions = z.array(sessionQuestionRowSchema).min(1).parse(rows);
  const first = questions[0]!;
  return {
    id: first.session_id,
    mode: first.session_mode,
    status: first.session_status,
    questionCount: first.question_count,
    answeredCount: first.answered_count,
    correctCount: first.correct_count,
    timed: first.timed,
    timeLimitSeconds: first.time_limit_seconds,
    allowPause: first.allow_pause,
    isPaused: first.is_paused,
    remainingSeconds: first.remaining_seconds,
    feedbackReleased: first.feedback_released,
    questions,
  };
}

export function parseAnswerSubmission(rows: unknown[]): AnswerSubmission {
  return submissionSchema.parse(z.array(z.unknown()).length(1).parse(rows)[0]);
}
