import { z } from "zod";

import {
  achievementSchema,
  challengeCreationExamSchema,
  challengeCreationStudentSchema,
  createChallengeSchema,
  encouragementSchema,
  groupChallengeRows,
  type Achievement,
  type ChallengeCreationExam,
  type ChallengeCreationStudent,
  type CreateChallengeInput,
  type Encouragement,
  type EncouragementReaction,
  type PrivateChallenge,
} from "../features/challenges/schemas";
import { getSupabaseClient } from "../lib/supabase/client";

export async function fetchChallengeCreationStudents(): Promise<ChallengeCreationStudent[]> {
  const { data, error } = await getSupabaseClient().rpc("get_challenge_creation_students");
  if (error) throw error;
  return z.array(challengeCreationStudentSchema).parse(data);
}

export async function fetchChallengeCreationExams(
  studentIds: string[],
): Promise<ChallengeCreationExam[]> {
  const { data, error } = await getSupabaseClient().rpc("get_challenge_creation_exams", {
    p_student_ids: studentIds,
  });
  if (error) throw error;
  return z.array(challengeCreationExamSchema).parse(data);
}

export async function createPrivateChallenge(input: CreateChallengeInput): Promise<string> {
  const parsed = createChallengeSchema.parse(input);
  const endsAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { data, error } = await getSupabaseClient().rpc("create_private_challenge", {
    p_title: parsed.title,
    p_exam_id: parsed.examId,
    p_student_ids: parsed.studentIds,
    p_question_count: parsed.questionCount,
    p_ends_at: endsAt,
  });
  if (error) throw error;
  return z.uuid().parse(data);
}

export async function fetchPrivateChallenges(): Promise<PrivateChallenge[]> {
  const { data, error } = await getSupabaseClient().rpc("get_private_challenges");
  if (error) throw error;
  return groupChallengeRows(data);
}

export async function fetchChallengeEncouragements(challengeId: string): Promise<Encouragement[]> {
  const { data, error } = await getSupabaseClient().rpc("get_challenge_encouragements", {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
  return z.array(encouragementSchema).parse(data);
}

export async function sendChallengeEncouragement(input: {
  challengeId: string;
  reaction: EncouragementReaction;
  recipientId: string;
}): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc("send_challenge_encouragement", {
    p_challenge_id: input.challengeId,
    p_reaction: input.reaction,
    p_recipient_id: input.recipientId,
  });
  if (error) throw error;
  return z.uuid().parse(data);
}

export async function fetchStudentAchievements(studentId?: string): Promise<Achievement[]> {
  const args = studentId ? { p_student_id: studentId } : {};
  const { data, error } = await getSupabaseClient().rpc("get_student_achievements", args);
  if (error) throw error;
  return z.array(achievementSchema).parse(data);
}
