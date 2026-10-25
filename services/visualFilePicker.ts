import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { validateVisualPng, type PickedVisual } from "../features/admin/visuals";

export async function pickLearningVisual(): Promise<PickedVisual | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "image/png",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0]!;
  if (asset.size && asset.size > 5242880) throw new Error("Choose a PNG no larger than 5 MB.");
  const bytes = await new File(asset.uri).bytes();
  return { name: asset.name, uri: asset.uri, bytes, ...validateVisualPng(bytes) };
}
