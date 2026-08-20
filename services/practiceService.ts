import { z } from "zod";

import {
  practiceTestOptionSchema,
  practiceReviewProgressSchema,
  practiceTopicResultSchema,
  practiceWeakAreaSchema,
  type PracticeTestOption,
  type PracticeReviewProgress,
  type PracticeSelectionStrategy,
  type PracticeTopicResult,
  type PracticeWeakArea,
} from "../features/practice/schemas";
import { getSupabaseClient } from "../lib/supabase/client";

export async function fetchPracticeTestOptions(): Promise<PracticeTestOption[]> {
  const { data, error } = await getSupabaseClient().rpc("get_practice_test_options");
  if (error) throw error;
  return z.array(practiceTestOptionSchema).parse(data);
}

export async function createPracticeTest(
  blueprintId: string,
  timed: boolean,
  strategy: PracticeSelectionStrategy,
): Promise<string> {
  const functionName = (
    {
      aerospace_full_exam: "create_aerospace_full_practice_exam",
      fixed_blueprint: "create_practice_test",
      mitchell_full_exam: "create_mitchell_full_practice_exam",
    } as const
  )[strategy];
  const { data, error } = await getSupabaseClient().rpc(functionName, {
    p_blueprint_id: blueprintId,
    p_timed: timed,
  });
  if (error) throw error;
  return z.uuid().parse(data);
}

export async function setPracticeTestQuestionFlag(
  sessionQuestionId: string,
  flagged: boolean,
): Promise<void> {
  const { error } = await getSupabaseClient().rpc("set_practice_test_question_flag", {
    p_session_question_id: sessionQuestionId,
    p_flagged: flagged,
  });
  if (error) throw error;
}

export async function setPracticeTestPaused(sessionId: string, paused: boolean): Promise<void> {
  const { error } = await getSupabaseClient().rpc("set_practice_test_paused", {
    p_session_id: sessionId,
    p_paused: paused,
  });
  if (error) throw error;
}

export async function completePracticeTest(sessionId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc("complete_practice_test", {
    p_session_id: sessionId,
  });
  if (error) throw error;
}

export async function fetchPracticeTestResults(sessionId: string): Promise<PracticeTopicResult[]> {
  const { data, error } = await getSupabaseClient().rpc("get_practice_test_results", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return z.array(practiceTopicResultSchema).parse(data);
}

export async function fetchPracticeTestReviewProgress(
  sessionId: string,
): Promise<PracticeReviewProgress> {
  const { data, error } = await getSupabaseClient().rpc("get_practice_test_review_progress", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return practiceReviewProgressSchema.parse(data?.[0]);
}

export async function markPracticeAnswerReviewed(sessionQuestionId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc("mark_practice_answer_reviewed", {
    p_session_question_id: sessionQuestionId,
  });
  if (error) throw error;
}

export async function fetchPracticeTestWeakAreas(sessionId: string): Promise<PracticeWeakArea[]> {
  const { data, error } = await getSupabaseClient().rpc("get_practice_test_weak_areas", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return z.array(practiceWeakAreaSchema).parse(data);
}
