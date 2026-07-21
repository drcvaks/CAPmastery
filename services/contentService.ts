import {
  parseApprovedQuestionRows,
  type ApprovedQuestionPreview,
} from "../features/content/schemas";
import { getSupabaseClient } from "../lib/supabase/client";
import type { Database } from "../types/database";

type ExamRow = Pick<
  Database["public"]["Tables"]["exams"]["Row"],
  "id" | "program_id" | "code" | "title" | "description" | "sort_order"
>;
type TopicRow = Pick<
  Database["public"]["Tables"]["topics"]["Row"],
  "id" | "exam_id" | "code" | "title" | "description" | "sort_order"
>;
export type ContentTopic = TopicRow;
export type ContentExam = ExamRow & { topics: ContentTopic[] };

export async function fetchContentCatalog(): Promise<ContentExam[]> {
  const supabase = getSupabaseClient();
  const [examsResult, topicsResult] = await Promise.all([
    supabase
      .from("exams")
      .select("id, program_id, code, title, description, sort_order")
      .eq("status", "active")
      .order("sort_order"),
    supabase
      .from("topics")
      .select("id, exam_id, code, title, description, sort_order")
      .eq("status", "active")
      .order("sort_order"),
  ]);

  if (examsResult.error) throw examsResult.error;
  if (topicsResult.error) throw topicsResult.error;

  return examsResult.data.map((exam) => ({
    ...exam,
    topics: topicsResult.data.filter((topic) => topic.exam_id === exam.id),
  }));
}

export async function fetchApprovedQuestionPreviews(
  examId: string,
  topicId?: string,
): Promise<ApprovedQuestionPreview[]> {
  const { data, error } = await getSupabaseClient().rpc("get_approved_questions", {
    p_exam_id: examId,
    p_limit: 20,
    ...(topicId ? { p_topic_id: topicId } : {}),
  });

  if (error) throw error;
  return parseApprovedQuestionRows(data);
}
