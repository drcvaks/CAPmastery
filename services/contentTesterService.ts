import { z } from "zod";
import { getSupabaseClient } from "../lib/supabase/client";
import type { Json } from "../types/database";
import {
  reviewQuestionSchema,
  reviewQueueItemSchema,
  type ReviewEditPayload,
} from "../features/admin/schemas";
import {
  learningVisualSchema,
  validateVisualPng,
  type LearningVisual,
  type PickedVisual,
} from "../features/admin/visuals";

export const grantSchema = z.object({
  kind: z.enum(["question", "image"]),
  exam_id: z.uuid().nullable(),
  chapter_id: z.uuid().nullable(),
});
export type TesterGrant = z.infer<typeof grantSchema>;
const learningAccessSchema = z.object({
  grants: z.array(grantSchema),
  sections: z.array(
    z.object({
      exam_id: z.uuid(),
      exam_title: z.string(),
      chapter_id: z.uuid().nullable(),
      title: z.string(),
      module_number: z.number().nullable(),
      chapter_number: z.number().nullable(),
      question_count: z.number().int().nonnegative(),
      image_count: z.number().int().nonnegative(),
      packages: z.array(z.string()),
    }),
  ),
});
const proposalSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["question", "image"]),
  target: z.string(),
  author_name: z.string(),
  reason: z.string(),
  status: z.enum(["uploading", "pending", "approved", "rejected", "changes_requested"]),
  decision_notes: z.string().nullable(),
  upload_path: z.string().nullable(),
  before_content: z.record(z.string(), z.unknown()),
  proposed_content: z.record(z.string(), z.unknown()),
});
export type ContentProposal = z.infer<typeof proposalSchema>;
export type ProposalDecision = "approved" | "rejected" | "changes_requested";

export type LearningAccessSection = z.infer<typeof learningAccessSchema>["sections"][number];

export async function learningAccess(
  userId: string,
  changes?: { grants?: TesterGrant[]; studentEnabled?: boolean; packages?: string[] },
) {
  const { data, error } = await getSupabaseClient().rpc("admin_learning_access", {
    p_user_id: userId,
    p_grants: changes?.grants,
    p_student_enabled: changes?.studentEnabled,
    p_import_packages: changes?.packages,
  });
  if (error) throw error;
  return learningAccessSchema.parse(data);
}
export async function fetchTesterQuestions() {
  const { data, error } = await getSupabaseClient().rpc("get_tester_question_catalog");
  if (error) throw error;
  return z.array(reviewQueueItemSchema).parse(data);
}
export async function fetchTesterQuestion(id: string) {
  const { data, error } = await getSupabaseClient().rpc("get_tester_question", {
    p_question_id: id,
  });
  if (error) throw error;
  return reviewQuestionSchema.parse(data);
}
export async function fetchTesterVisuals() {
  const { data, error } = await getSupabaseClient().rpc("get_tester_visuals");
  if (error) throw error;
  return z.array(learningVisualSchema).parse(data);
}
async function submit(
  kind: "question" | "image",
  target: string,
  payload: Json,
  reason: string,
  updatedAt: unknown,
) {
  const { data, error } = await getSupabaseClient().rpc("submit_content_proposal", {
    p_kind: kind,
    p_target: target,
    p_payload: payload,
    p_reason: z.string().trim().min(10).max(1000).parse(reason),
    p_expected_updated_at: z.string().min(1).parse(updatedAt),
  });
  if (error) throw error;
  return z.object({ id: z.uuid(), upload_path: z.string().nullable() }).parse(data);
}
export async function proposeQuestion(
  id: string,
  payload: ReviewEditPayload,
  reason: string,
  updatedAt: unknown,
) {
  await submit("question", id, payload, reason, updatedAt);
}
export async function proposeVisual({
  visual,
  file,
  altText,
  reason,
}: {
  visual: LearningVisual;
  file: PickedVisual;
  altText: string;
  reason: string;
}) {
  const { width, height } = validateVisualPng(file.bytes);
  const pending = await submit(
    "image",
    visual.asset_key,
    { width, height, alt_text: altText },
    reason,
    visual.updated_at,
  );
  const path = z
    .string()
    .regex(/^assets\/cap-visuals\/revision-[a-f0-9-]{36}\.png$/)
    .parse(pending.upload_path);
  const client = getSupabaseClient();
  const { error: uploadError } = await client.storage
    .from("learning-visuals")
    .upload(path, file.bytes, { contentType: "image/png", upsert: false });
  if (uploadError) throw uploadError;
  const { error } = await client.rpc("finish_content_image_proposal", { p_id: pending.id });
  if (error) throw error;
}
export async function fetchContentProposals() {
  const { data, error } = await getSupabaseClient().rpc("get_content_proposals");
  if (error) throw error;
  return z.array(proposalSchema).parse(data);
}
export async function decideContentProposal({
  id,
  decision,
  notes,
  ratings,
}: {
  id: string;
  decision: ProposalDecision;
  notes: string;
  ratings: { accuracy: string; clarity: string; source: string };
}) {
  const { error } = await getSupabaseClient().rpc("admin_decide_content_proposal", {
    p_id: id,
    p_decision: decision,
    p_notes: notes,
    p_ratings: ratings,
  });
  if (error) throw error;
}
