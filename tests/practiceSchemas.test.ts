import { practiceTestOptionSchema } from "../features/practice/schemas";

const aerospaceOption = {
  blueprint_id: "70000000-0000-4000-8000-000000000003",
  blueprint_code: "MITCHELL_AEROSPACE_FULL_50",
  selection_strategy: "aerospace_full_exam",
  exam_id: "20000000-0000-4000-8000-000000000002",
  exam_title: "Billy Mitchell Aerospace",
  blueprint_name: "Full Mitchell Aerospace Practice Exam",
  description: "Unofficial Aerospace practice exam.",
  question_count: 50,
  time_limit_seconds: 3600,
  allow_untimed: true,
  allow_pause: true,
};

describe("practice-test option schema", () => {
  it("accepts the Aerospace full-exam selection strategy", () => {
    expect(practiceTestOptionSchema.parse(aerospaceOption)).toEqual(aerospaceOption);
  });

  it("rejects an unknown client-selected strategy", () => {
    expect(() =>
      practiceTestOptionSchema.parse({ ...aerospaceOption, selection_strategy: "client_random" }),
    ).toThrow();
  });
});
