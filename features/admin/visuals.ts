import { z } from "zod";

export const learningVisualSchema = z.object({
  asset_key: z.string().min(1),
  storage_path: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt_text: z.string().min(1),
  status: z.enum(["draft", "approved", "archived"]),
  updated_at: z.string(),
  locations: z.array(
    z.object({
      exam_id: z.uuid(),
      exam_code: z.string(),
      exam_title: z.string(),
      chapter_title: z.string(),
      module_number: z.number().int().nullable(),
      chapter_number: z.number().int().nullable(),
      question_count: z.number().int().positive(),
    }),
  ),
});
export type LearningVisual = z.infer<typeof learningVisualSchema>;
export type PickedVisual = {
  name: string;
  uri: string;
  bytes: Uint8Array;
  width: number;
  height: number;
};

export function validateVisualPng(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length > 5 * 1024 * 1024) throw new Error("Choose a PNG no larger than 5 MB.");
  if (
    bytes.length < 33 ||
    !signature.every((value, index) => bytes[index] === value) ||
    bytes[12] !== 73 ||
    bytes[13] !== 72 ||
    bytes[14] !== 68 ||
    bytes[15] !== 82
  ) {
    throw new Error("Choose a PNG image. Renaming a JPEG to .png does not convert it.");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16),
    height = view.getUint32(20);
  if (width < 1 || height < 1 || width > 20000 || height > 20000) {
    throw new Error("Image dimensions must be between 1 and 20,000 pixels.");
  }
  return { width, height };
}

function examRank(title: string) {
  const text = title.toLowerCase();
  if (text.includes("wright")) return 0;
  if (text.includes("mitchell") && text.includes("leadership")) return 1;
  if (text.includes("mitchell") && text.includes("aerospace")) return 2;
  if (text.includes("earhart")) return 3;
  return 99;
}
export function visualLibraryGroups(visuals: LearningVisual[]) {
  const groups = new Map<
    string,
    { id: string; title: string; sections: Map<string, LearningVisual[]> }
  >();
  for (const visual of visuals) {
    const locations = visual.locations.length
      ? visual.locations
      : [
          {
            exam_code: "UNLINKED",
            exam_title: "Other / unlinked images",
            chapter_title: "No question mappings",
            module_number: null,
            chapter_number: null,
          },
        ];
    for (const location of locations) {
      const group = groups.get(location.exam_code) ?? {
        id: location.exam_code,
        title: location.exam_title,
        sections: new Map<string, LearningVisual[]>(),
      };
      const label = `${location.module_number ? `Module ${location.module_number} · ` : ""}${location.chapter_number ? `Chapter ${location.chapter_number} · ` : ""}${location.chapter_title}`;
      const section = group.sections.get(label) ?? [];
      if (!section.some((item) => item.asset_key === visual.asset_key)) section.push(visual);
      group.sections.set(label, section);
      groups.set(group.id, group);
    }
  }
  return [...groups.values()]
    .sort((a, b) => {
      return examRank(a.title) - examRank(b.title) || a.title.localeCompare(b.title);
    })
    .map((group) => ({
      ...group,
      sections: [...group.sections].sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    }));
}
