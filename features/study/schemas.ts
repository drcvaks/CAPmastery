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
  session_status: z.enum(["active", "completed", "abandoned"]),
  question_count: z.number().int().positive(),
  answered_count: z.number().int().nonnegative(),
  correct_count: z.number().int().nonnegative(),
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
});

const submissionSchema = z.object({
  attempt_id: z.uuid(),
  is_correct: z.boolean(),
  correct_choice_id: z.uuid(),
  explanation: z.string().min(1),
  selected_choice_feedback: z.string().nullable(),
  remediation: z.string().nullable(),
  common_mistake: z.string().nullable(),
  source_reference: z.string().min(1),
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
  status: StudyQuestion["session_status"];
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  questions: StudyQuestion[];
};

export function parseStudySessionRows(rows: unknown[]): StudySession {
  const questions = z.array(sessionQuestionRowSchema).min(1).parse(rows);
  const first = questions[0]!;
  return {
    id: first.session_id,
    status: first.session_status,
    questionCount: first.question_count,
    answeredCount: first.answered_count,
    correctCount: first.correct_count,
    questions,
  };
}

export function parseAnswerSubmission(rows: unknown[]): AnswerSubmission {
  return submissionSchema.parse(z.array(z.unknown()).length(1).parse(rows)[0]);
}
