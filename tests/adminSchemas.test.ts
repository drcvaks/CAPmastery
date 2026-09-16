import { questionStyleReferenceSchema } from "../features/admin/schemas";

describe("admin review schemas", () => {
  it.each([
    "pre_sample_bank_review",
    "Mitchell_sample_style_analysis",
    "Mitchell_Aerospace_sample_style_analysis",
    "Wright Brothers milestone sample exams used as style/difficulty reference only",
    "Three Wright Brothers Milestone exam forms used as style/difficulty reference only",
    "Three Earhart Milestone Leadership exam forms used as style/difficulty reference only; no milestone question copied",
    "Three Earhart Milestone Leadership exam forms used only as style/difficulty references; no milestone question copied",
  ])("accepts the governed style reference %s", (styleReference) => {
    expect(questionStyleReferenceSchema.parse(styleReference)).toBe(styleReference);
  });

  it("rejects an ungoverned style reference", () => {
    expect(() => questionStyleReferenceSchema.parse("unverified exam source")).toThrow();
  });
});
