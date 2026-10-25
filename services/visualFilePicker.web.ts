import * as DocumentPicker from "expo-document-picker";
import { validateVisualPng, type PickedVisual } from "../features/admin/visuals";

export async function pickLearningVisual(): Promise<PickedVisual | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "image/png",
    multiple: false,
    base64: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0]!;
  if (!asset.file) throw new Error("The browser did not return an image file.");
  if (asset.file.size > 5242880) throw new Error("Choose a PNG no larger than 5 MB.");
  const bytes = new Uint8Array(await asset.file.arrayBuffer());
  return { name: asset.name, uri: asset.uri, bytes, ...validateVisualPng(bytes) };
}
