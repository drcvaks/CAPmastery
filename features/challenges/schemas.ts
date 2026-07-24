import { z } from "zod";

export const encouragementReactionSchema = z.enum([
  "great_effort",
  "keep_going",
  "proud_of_you",
  "nice_comeback",
  "team_spirit",
]);

export const challengeCreationStudentSchema = z.object({
  student_id: z.uuid(),
  display_name: z.string().min(1),
});

export const challengeCreationExamSchema = z.object({
  exam_id: z.uuid(),
  exam_title: z.string().min(1),
  available_question_count: z.number().int().nonnegative(),
});

export const challengeParticipantRowSchema = z.object({
  challenge_id: z.uuid(),
  title: z.string().min(1),
  exam_id: z.uuid(),
  exam_title: z.string().min(1),
  challenge_status: z.enum(["active", "completed", "cancelled"]),
  question_count: z.number().int().min(3).max(20),
  starts_at: z.iso.datetime({ offset: true }),
  ends_at: z.iso.datetime({ offset: true }),
  created_by: z.uuid(),
  can_manage: z.boolean(),
  participant_student_id: z.uuid(),
  participant_name: z.string().min(1),
  participant_session_id: z.uuid(),
  participant_completed: z.boolean(),
  results_revealed: z.boolean(),
  score_percent: z.number().min(0).max(100).nullable(),
  improvement_percent: z.number().nullable(),
  total_points: z.number().int().min(0).max(100).nullable(),
  recognition: z.string().min(1).nullable(),
});

export const encouragementSchema = z.object({
  encouragement_id: z.uuid(),
  sender_id: z.uuid(),
  sender_name: z.string().min(1),
  recipient_id: z.uuid(),
  recipient_name: z.string().min(1),
  reaction: encouragementReactionSchema,
  created_at: z.iso.datetime({ offset: true }),
});

export const achievementSchema = z.object({
  achievement_id: z.uuid(),
  code: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  earned: z.boolean(),
  awarded_at: z.iso.datetime({ offset: true }).nullable(),
});

export const createChallengeSchema = z.object({
  title: z.string().trim().min(3).max(100),
  examId: z.uuid(),
  studentIds: z
    .array(z.uuid())
    .length(2)
    .refine((ids) => new Set(ids).size === 2, {
      message: "Choose two different students.",
    }),
  questionCount: z.number().int().min(3).max(20),
});

export type EncouragementReaction = z.infer<typeof encouragementReactionSchema>;
export type ChallengeCreationStudent = z.infer<typeof challengeCreationStudentSchema>;
export type ChallengeCreationExam = z.infer<typeof challengeCreationExamSchema>;
export type ChallengeParticipantRow = z.infer<typeof challengeParticipantRowSchema>;
export type Encouragement = z.infer<typeof encouragementSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

export type PrivateChallenge = Omit<
  ChallengeParticipantRow,
  | "participant_student_id"
  | "participant_name"
  | "participant_session_id"
  | "participant_completed"
  | "score_percent"
  | "improvement_percent"
  | "total_points"
  | "recognition"
> & {
  participants: {
    studentId: string;
    name: string;
    sessionId: string;
    completed: boolean;
    scorePercent: number | null;
    improvementPercent: number | null;
    totalPoints: number | null;
    recognition: string | null;
  }[];
};

export function groupChallengeRows(input: unknown): PrivateChallenge[] {
  const rows = z.array(challengeParticipantRowSchema).parse(input);
  const grouped = new Map<string, PrivateChallenge>();
  for (const row of rows) {
    const existing = grouped.get(row.challenge_id);
    const challenge =
      existing ??
      ({
        challenge_id: row.challenge_id,
        title: row.title,
        exam_id: row.exam_id,
        exam_title: row.exam_title,
        challenge_status: row.challenge_status,
        question_count: row.question_count,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        created_by: row.created_by,
        can_manage: row.can_manage,
        results_revealed: row.results_revealed,
        participants: [],
      } satisfies PrivateChallenge);
    challenge.participants.push({
      studentId: row.participant_student_id,
      name: row.participant_name,
      sessionId: row.participant_session_id,
      completed: row.participant_completed,
      scorePercent: row.score_percent,
      improvementPercent: row.improvement_percent,
      totalPoints: row.total_points,
      recognition: row.recognition,
    });
    grouped.set(row.challenge_id, challenge);
  }
  return [...grouped.values()];
}

export const ENCOURAGEMENT_LABELS: Record<EncouragementReaction, string> = {
  great_effort: "Great effort!",
  keep_going: "Keep going!",
  proud_of_you: "Proud of you!",
  nice_comeback: "Nice comeback!",
  team_spirit: "Team spirit!",
};
