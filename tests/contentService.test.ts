import { parseApprovedQuestionRows } from "../features/content/schemas";

describe("parseApprovedQuestionRows", () => {
  const row = {
    id: "88888888-8888-4888-8888-888888888801",
    exam_id: "20000000-0000-4000-8000-000000000001",
    topic_id: "40000000-0000-4000-8000-000000000001",
    question_text: "Synthetic test question?",
    question_type: "multiple_choice" as const,
    difficulty: "easy" as const,
    cognitive_level: "recall" as const,
    source_reference: "Synthetic source",
  };

  it("accepts the student-safe choice projection", () => {
    const choices = [
      {
        id: "99999999-9999-4999-8999-999999999901",
        key: "A",
        text: "Synthetic option",
        sortOrder: 0,
      },
    ];

    expect(parseApprovedQuestionRows([{ ...row, choices }])).toEqual([{ ...row, choices }]);
  });

  it("rejects unexpected correctness fields at the service boundary", () => {
    expect(() =>
      parseApprovedQuestionRows([
        {
          ...row,
          choices: [
            {
              id: "99999999-9999-4999-8999-999999999901",
              key: "A",
              text: "Synthetic option",
              sortOrder: 0,
              isCorrect: true,
            },
          ],
        },
      ]),
    ).toThrow();
  });
});
