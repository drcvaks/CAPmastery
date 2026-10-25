import { z } from "zod";
import {
  learningVisualSchema,
  validateVisualPng,
  type LearningVisual,
  type PickedVisual,
} from "../features/admin/visuals";
import { getSupabaseClient } from "../lib/supabase/client";

export async function fetchLearningVisuals() {
  const { data, error } = await getSupabaseClient().rpc("admin_get_learning_visuals");
  if (error) throw error;
  return z.array(learningVisualSchema).parse(data);
}

export async function fetchLearningVisualUrl(path: string) {
  const { data, error } = await getSupabaseClient()
    .storage.from("learning-visuals")
    .createSignedUrl(path, 600);
  if (error) throw error;
  return z.string().url().parse(data.signedUrl);
}

export async function replaceLearningVisual(input: {
  visual: LearningVisual;
  file: PickedVisual;
  altText: string;
  reason: string;
}) {
  const { width, height } = validateVisualPng(input.file.bytes);
  const altText = z.string().trim().min(1).max(1000).parse(input.altText);
  const reason = z.string().trim().min(10).max(500).parse(input.reason);
  const client = getSupabaseClient();
  // A new object preserves the previous file and avoids stale CDN images.
  // This is a collision-resistant object name, not an authentication token.
  const revision = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const random = Math.floor(Math.random() * 16);
    return (c === "x" ? random : (random & 3) | 8).toString(16);
  });
  const path = `assets/cap-visuals/revision-${revision}.png`;
  const { error: uploadError } = await client.storage
    .from("learning-visuals")
    .upload(path, input.file.bytes, { contentType: "image/png", upsert: false });
  if (uploadError) throw uploadError;
  const { error } = await client.rpc("admin_replace_learning_visual", {
    p_asset_key: input.visual.asset_key,
    p_expected_storage_path: input.visual.storage_path,
    p_storage_path: path,
    p_width: width,
    p_height: height,
    p_alt_text: altText,
    p_reason: reason,
  });
  if (error)
    throw new Error(
      "The image uploaded, but activation could not be confirmed. Refresh the library before trying again. The previous file is retained.",
    );
}
