import { fetchLearningVisuals, replaceLearningVisual } from "../services/adminVisualService";
import { getSupabaseClient } from "../lib/supabase/client";
import type { LearningVisual } from "../features/admin/visuals";
jest.mock("../lib/supabase/client", () => ({ getSupabaseClient: jest.fn() }));
const rpc = jest.fn(),
  upload = jest.fn();
const visual: LearningVisual = {
  asset_key: "test_guide",
  storage_path: "assets/cap-visuals/old.png",
  width: 100,
  height: 100,
  alt_text: "Original guide",
  status: "approved",
  updated_at: "2026-10-25",
  locations: [],
};
function file() {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, 200);
  view.setUint32(20, 150);
  return { name: "new.png", uri: "file:///new.png", bytes, width: 200, height: 150 };
}
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(getSupabaseClient)
    .mockReturnValue({ rpc, storage: { from: jest.fn().mockReturnValue({ upload }) } } as never);
  upload.mockResolvedValue({ error: null });
  rpc.mockResolvedValue({ error: null });
});
it("uploads immutable PNG bytes then activates through the expected-path RPC", async () => {
  const picked = file();
  await replaceLearningVisual({
    visual,
    file: picked,
    altText: "Corrected guide",
    reason: "Corrected diagram labels",
  });
  expect(upload).toHaveBeenCalledWith(
    expect.stringMatching(/^assets\/cap-visuals\/revision-.*\.png$/),
    picked.bytes,
    { contentType: "image/png", upsert: false },
  );
  expect(rpc).toHaveBeenCalledWith(
    "admin_replace_learning_visual",
    expect.objectContaining({
      p_asset_key: "test_guide",
      p_expected_storage_path: visual.storage_path,
      p_width: 200,
      p_height: 150,
    }),
  );
});
it("never activates a failed upload", async () => {
  upload.mockResolvedValue({ error: new Error("Upload failed") });
  await expect(
    replaceLearningVisual({
      visual,
      file: file(),
      altText: "Guide",
      reason: "Corrected diagram labels",
    }),
  ).rejects.toThrow("Upload failed");
  expect(rpc).not.toHaveBeenCalled();
});
it("explains activation failure without overwriting or deleting the old image", async () => {
  rpc.mockResolvedValue({ error: new Error("Conflict") });
  await expect(
    replaceLearningVisual({
      visual,
      file: file(),
      altText: "Guide",
      reason: "Corrected diagram labels",
    }),
  ).rejects.toThrow("activation could not be confirmed");
});
it("validates input before uploading", async () => {
  await expect(
    replaceLearningVisual({ visual, file: file(), altText: "Guide", reason: "short" }),
  ).rejects.toThrow();
  expect(upload).not.toHaveBeenCalled();
});
it("propagates catalog authorization errors", async () => {
  rpc.mockResolvedValue({ error: new Error("Administrator role required") });
  await expect(fetchLearningVisuals()).rejects.toThrow("Administrator role required");
});
