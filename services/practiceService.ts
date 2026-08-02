import { z } from "zod";

import {
  practiceTestOptionSchema,
  practiceTopicResultSchema,
  practiceWeakAreaSchema,
  type PracticeTestOption,
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
  strategy: "fixed_blueprint" | "mitchell_full_exam",
): Promise<string> {
  const functionName =
    strategy === "mitchell_full_exam"
      ? "create_mitchell_full_practice_exam"
      : "create_practice_test";
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

export async function fetchPracticeTestWeakAreas(sessionId: string): Promise<PracticeWeakArea[]> {
  const { data, error } = await getSupabaseClient().rpc("get_practice_test_weak_areas", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  return z.array(practiceWeakAreaSchema).parse(data);
}
