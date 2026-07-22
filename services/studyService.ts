import { getSupabaseClient } from "../lib/supabase/client";
import {
  parseAnswerSubmission,
  parseStudySessionRows,
  type AnswerSubmission,
  type StudySession,
} from "../features/study/schemas";

export async function createStudySession(examId: string, topicId?: string): Promise<string> {
  const { data, error } = await getSupabaseClient().rpc("create_study_session", {
    p_exam_id: examId,
    p_question_count: 10,
    ...(topicId ? { p_topic_id: topicId } : {}),
  });
  if (error) throw error;
  return data;
}

export async function fetchStudySession(sessionId: string): Promise<StudySession> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("get_study_session_questions", {
    p_session_id: sessionId,
  });
  if (error) throw error;
  const rows = await Promise.all(
    data.map(async (row) => {
      if (!row.visual_storage_path) return { ...row, visual_uri: null };
      const { data: signed } = await client.storage
        .from("learning-visuals")
        .createSignedUrl(row.visual_storage_path, 10 * 60);
      return { ...row, visual_uri: signed?.signedUrl ?? null };
    }),
  );
  return parseStudySessionRows(rows);
}

export async function submitStudyAnswer(input: {
  sessionQuestionId: string;
  selectedChoiceId: string;
  responseTimeMs: number;
  confidence?: number;
}): Promise<AnswerSubmission> {
  const { data, error } = await getSupabaseClient().rpc("submit_answer", {
    p_session_question_id: input.sessionQuestionId,
    p_selected_choice_id: input.selectedChoiceId,
    p_response_time_ms: Math.max(0, Math.min(Math.round(input.responseTimeMs), 3_600_000)),
    ...(input.confidence ? { p_confidence: input.confidence } : {}),
  });
  if (error) throw error;
  return parseAnswerSubmission(data);
}
