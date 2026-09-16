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

  it("accepts an untimed Wright Brothers mock exam", () => {
    const wrightOption = {
      ...aerospaceOption,
      blueprint_code: "WRIGHT_BROTHERS_MOCK_30",
      selection_strategy: "wright_brothers_mock_exam",
      question_count: 30,
      time_limit_seconds: null,
      allow_pause: false,
    };

    expect(practiceTestOptionSchema.parse(wrightOption)).toEqual(wrightOption);
  });

  it("accepts the timed Earhart full-exam selection strategy", () => {
    const earhartOption = {
      ...aerospaceOption,
      blueprint_code: "EARHART_FULL_50",
      selection_strategy: "earhart_full_exam",
      exam_id: "20000000-0000-4000-8000-000000000004",
      exam_title: "Earhart Leadership",
      blueprint_name: "Full Earhart Leadership Practice Exam",
    };

    expect(practiceTestOptionSchema.parse(earhartOption)).toEqual(earhartOption);
  });

  it("rejects an unknown client-selected strategy", () => {
    expect(() =>
      practiceTestOptionSchema.parse({ ...aerospaceOption, selection_strategy: "client_random" }),
    ).toThrow();
  });
});
