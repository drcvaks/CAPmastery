import { z } from "zod";
import { getSupabaseClient } from "../lib/supabase/client";
import type { IssueCategory } from "../features/study/issueCategories";

const status = z.enum(["open", "reviewing", "resolved", "dismissed"]);
export type IssueStatus = z.infer<typeof status>;
const reports = z.array(
  z.object({
    id: z.uuid(),
    question_id: z.uuid(),
    question_version: z.number().nullable(),
    current_version: z.number(),
    categories: z.array(z.string()),
    report_type: z.string(),
    details: z.string(),
    status,
    created_at: z.string(),
    reporter_name: z.string(),
    reporter_email: z.string().nullable(),
    question_text: z.string(),
    exam_title: z.string(),
    topic_title: z.string(),
  }),
);

export async function submitStudyIssue(id: string, categories: IssueCategory[], details: string) {
  const { error } = await getSupabaseClient().rpc("submit_study_issue", {
    p_session_question_id: id,
    p_categories: categories,
    p_details: details,
  });
  if (error) throw error;
}

export async function listStudyIssues(state: IssueStatus, offset: number) {
  const { data, error } = await getSupabaseClient().rpc("admin_study_issues", {
    p_status: state,
    p_offset: offset,
  });
  if (error) throw error;
  return reports.parse(data);
}

export async function getStudyIssueSnapshot(id: string) {
  const { data, error } = await getSupabaseClient().rpc("admin_study_issue_snapshot", {
    p_report_id: id,
  });
  if (error) throw error;
  return z
    .object({
      question: z.object({ question_text: z.string(), source_reference: z.string().nullish() }),
      choices: z.array(z.object({ id: z.string(), key: z.string(), text: z.string() })),
      answer: z
        .object({ correct_choice_id: z.string(), explanation: z.string().nullable() })
        .nullish(),
      learning_support: z
        .object({
          memory_aid: z.string().nullish(),
          visual_asset_key: z.string().nullish(),
          visual_caption: z.string().nullish(),
        })
        .nullish(),
    })
    .nullable()
    .parse(data);
}

export async function setStudyIssueStatus(id: string, state: IssueStatus) {
  const { error } = await getSupabaseClient().rpc("admin_set_study_issue_status", {
    p_report_id: id,
    p_status: state,
  });
  if (error) throw error;
}
