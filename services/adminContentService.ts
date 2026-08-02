import { z } from "zod";

import type { QuestionCsvRow } from "../features/admin/csv";
import {
  duplicateWarningSchema,
  importJobSchema,
  reviewQuestionSchema,
  reviewQueueItemSchema,
  type DuplicateWarning,
  type ImportJob,
  type ReviewEditPayload,
  type ReviewQuestion,
  type ReviewQueueItem,
} from "../features/admin/schemas";
import { getSupabaseClient } from "../lib/supabase/client";

export async function checkImportDuplicates(rows: QuestionCsvRow[]): Promise<DuplicateWarning[]> {
  const { data, error } = await getSupabaseClient().rpc("reviewer_check_import_duplicates", {
    p_rows: rows,
  });
  if (error) throw error;
  return z.array(duplicateWarningSchema).parse(data);
}

export async function importQuestionCsv(
  fileName: string,
  rows: QuestionCsvRow[],
): Promise<ImportJob> {
  const supabase = getSupabaseClient();
  const { data: jobId, error } = await supabase.rpc("reviewer_import_question_csv", {
    p_file_name: fileName,
    p_rows: rows,
  });
  if (error) throw error;
  const parsedId = z.uuid().parse(jobId);
  const { data: job, error: jobError } = await supabase
    .from("csv_import_jobs")
    .select(
      "id, file_name, rows_received, rows_accepted, rows_rejected, error_report, warning_report, status, created_at, completed_at",
    )
    .eq("id", parsedId)
    .single();
  if (jobError) throw jobError;
  return importJobSchema.parse(job);
}

export async function fetchReviewQueue(): Promise<ReviewQueueItem[]> {
  const { data, error } = await getSupabaseClient().rpc("get_content_review_queue");
  if (error) throw error;
  return z.array(reviewQueueItemSchema).parse(data);
}

export async function fetchReviewQuestion(questionId: string): Promise<ReviewQuestion> {
  const { data, error } = await getSupabaseClient().rpc("get_content_review_question", {
    p_question_id: questionId,
  });
  if (error) throw error;
  return reviewQuestionSchema.parse(data);
}

export async function saveReviewQuestion(
  questionId: string,
  payload: ReviewEditPayload,
  changeReason: string,
): Promise<number> {
  const { data, error } = await getSupabaseClient().rpc(
    "reviewer_save_question_with_classification",
    {
      p_question_id: questionId,
      p_payload: payload,
      p_change_reason: changeReason,
    },
  );
  if (error) throw error;
  return z.number().int().positive().parse(data);
}

export async function submitQuestionReview(input: {
  questionId: string;
  accuracyRating: number;
  clarityRating: number;
  sourceAlignmentRating: number;
  notes: string;
  decision: "approve" | "request_changes" | "reject";
}) {
  const { error } = await getSupabaseClient().rpc("reviewer_submit_question_review", {
    p_question_id: input.questionId,
    p_accuracy_rating: input.accuracyRating,
    p_clarity_rating: input.clarityRating,
    p_source_alignment_rating: input.sourceAlignmentRating,
    p_notes: input.notes,
    p_decision: input.decision,
  });
  if (error) throw error;
}
