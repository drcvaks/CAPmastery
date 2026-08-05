import {
  parseApprovedQuestionRows,
  type ApprovedQuestionPreview,
} from "../features/content/schemas";
import { isCatalogPlaceholder } from "../features/content/catalog";
import { getSupabaseClient } from "../lib/supabase/client";
import type { Database } from "../types/database";

type ExamRow = Pick<
  Database["public"]["Tables"]["exams"]["Row"],
  "id" | "program_id" | "code" | "title" | "description" | "sort_order"
>;
type TopicRow = Pick<
  Database["public"]["Tables"]["topics"]["Row"],
  "id" | "exam_id" | "volume_id" | "chapter_id" | "code" | "title" | "description" | "sort_order"
>;
type VolumeRow = Pick<
  Database["public"]["Tables"]["volumes"]["Row"],
  "id" | "code" | "title" | "sort_order"
>;
type ChapterRow = Pick<
  Database["public"]["Tables"]["chapters"]["Row"],
  "id" | "code" | "title" | "sort_order"
>;
export type ContentTopic = TopicRow & {
  volume: VolumeRow | null;
  chapter: ChapterRow | null;
};
export type ContentExam = ExamRow & { topics: ContentTopic[] };

export async function fetchContentCatalog(): Promise<ContentExam[]> {
  const supabase = getSupabaseClient();
  const [examsResult, topicsResult, volumesResult, chaptersResult] = await Promise.all([
    supabase
      .from("exams")
      .select("id, program_id, code, title, description, sort_order")
      .eq("status", "active")
      .order("sort_order"),
    supabase
      .from("topics")
      .select("id, exam_id, volume_id, chapter_id, code, title, description, sort_order")
      .eq("status", "active")
      .order("sort_order"),
    supabase
      .from("volumes")
      .select("id, code, title, sort_order")
      .eq("status", "active")
      .order("sort_order"),
    supabase
      .from("chapters")
      .select("id, code, title, sort_order")
      .eq("status", "active")
      .order("sort_order"),
  ]);

  if (examsResult.error) throw examsResult.error;
  if (topicsResult.error) throw topicsResult.error;
  if (volumesResult.error) throw volumesResult.error;
  if (chaptersResult.error) throw chaptersResult.error;

  return examsResult.data.map((exam) => ({
    ...exam,
    topics: topicsResult.data
      .filter((topic) => topic.exam_id === exam.id && !isCatalogPlaceholder(topic.code))
      .map((topic) => ({
        ...topic,
        volume: volumesResult.data.find((volume) => volume.id === topic.volume_id) ?? null,
        chapter: chaptersResult.data.find((chapter) => chapter.id === topic.chapter_id) ?? null,
      })),
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
