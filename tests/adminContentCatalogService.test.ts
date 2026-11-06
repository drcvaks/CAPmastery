import { fetchReviewQueue } from "../services/adminContentService";
import { getSupabaseClient } from "../lib/supabase/client";
jest.mock("../lib/supabase/client", () => ({ getSupabaseClient: jest.fn() }));
const rpc = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getSupabaseClient).mockReturnValue({ rpc } as never);
});
it("uses the complete protected curriculum catalog without slicing", async () => {
  const data = Array.from({ length: 1005 }, (_, index) => ({
    question_id: `81000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    external_id: `Q${index}`,
    question_text: "Synthetic review prompt",
    exam_title: "Wright Brothers",
    topic_title: "Chapter one",
    chapter_number: 1,
    module_number: null,
    review_status: "draft",
    version: 1,
    updated_at: "2026-11-03",
  }));
  rpc.mockResolvedValue({ data, error: null });
  const result = await fetchReviewQueue();
  expect(rpc).toHaveBeenCalledWith("get_content_review_catalog");
  expect(result).toHaveLength(1005);
  expect(result[1004]?.chapter_number).toBe(1);
});
it("preserves catalog authorization failures", async () => {
  rpc.mockResolvedValue({ data: null, error: new Error("Not authorized") });
  await expect(fetchReviewQueue()).rejects.toThrow("Not authorized");
});
