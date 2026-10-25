import {
  learningVisualSchema,
  validateVisualPng,
  visualLibraryGroups,
  type LearningVisual,
} from "../features/admin/visuals";

export function pngBytes(width = 1500, height = 1000) {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}
const visual: LearningVisual = {
  asset_key: "example_visual",
  storage_path: "assets/cap-visuals/example.png",
  width: 1500,
  height: 1000,
  alt_text: "Example guide",
  status: "approved",
  updated_at: "2026-10-25T00:00:00Z",
  locations: [],
};
it("validates PNG signatures, dimensions, and file limits", () => {
  expect(validateVisualPng(pngBytes())).toEqual({ width: 1500, height: 1000 });
  expect(() => validateVisualPng(new Uint8Array(40))).toThrow("PNG");
  expect(() => validateVisualPng(new Uint8Array(5242881))).toThrow("5 MB");
  expect(() => validateVisualPng(pngBytes(0))).toThrow("dimensions");
  expect(() => validateVisualPng(pngBytes(20001))).toThrow("dimensions");
});
it("keeps unlinked images visible and groups shared images by all uses", () => {
  const location = {
    exam_id: "20000000-0000-4000-8000-000000000003",
    exam_code: "WRIGHT_BROTHERS",
    exam_title: "Wright Brothers",
    chapter_title: "Leadership",
    chapter_number: 1,
    module_number: null,
    question_count: 8,
  };
  const linked = {
    ...visual,
    asset_key: "linked",
    locations: [location, { ...location, chapter_number: 2 }],
  };
  const groups = visualLibraryGroups([visual, linked]);
  expect(groups.map((group) => group.title)).toEqual([
    "Wright Brothers",
    "Other / unlinked images",
  ]);
  expect(groups[0]?.sections).toHaveLength(2);
  expect(groups[1]?.sections[0]?.[1][0]?.asset_key).toBe("example_visual");
});
it("rejects malformed inventory metadata", () => {
  expect(learningVisualSchema.parse(visual)).toEqual(visual);
  expect(() => learningVisualSchema.parse({ ...visual, width: 0 })).toThrow();
});
