import { filterCatalogForStudyAccess } from "../features/content/catalog";
import { parseApprovedQuestionRows } from "../features/content/schemas";
import type { ContentExam } from "../services/contentService";

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

describe("filterCatalogForStudyAccess", () => {
  const catalog = [
    {
      id: "20000000-0000-4000-8000-000000000001",
      program_id: "10000000-0000-4000-8000-000000000001",
      code: "MITCHELL_LEADERSHIP",
      title: "Billy Mitchell Leadership",
      description: null,
      sort_order: 10,
      topics: [
        {
          id: "40000000-0000-4000-8000-000000000011",
          exam_id: "20000000-0000-4000-8000-000000000001",
          volume_id: null,
          chapter_id: null,
          code: "LTL_TOPIC",
          title: "Leadership topic",
          description: null,
          sort_order: 10,
          volume: null,
          chapter: null,
        },
      ],
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      program_id: "10000000-0000-4000-8000-000000000001",
      code: "MITCHELL_AEROSPACE",
      title: "Billy Mitchell Aerospace",
      description: null,
      sort_order: 20,
      topics: [
        {
          id: "40000000-0000-4000-8000-000000000021",
          exam_id: "20000000-0000-4000-8000-000000000002",
          volume_id: null,
          chapter_id: null,
          code: "AD_M1_C1",
          title: "Aerospace topic",
          description: null,
          sort_order: 10,
          volume: null,
          chapter: null,
        },
      ],
    },
  ] satisfies ContentExam[];

  it("shows only the exam and topic with at least ten accessible questions", () => {
    expect(
      filterCatalogForStudyAccess(catalog, [
        {
          exam_id: "20000000-0000-4000-8000-000000000002",
          topic_id: "40000000-0000-4000-8000-000000000021",
          available_question_count: 100,
        },
      ]).map((exam) => exam.code),
    ).toEqual(["MITCHELL_AEROSPACE"]);
  });

  it("hides a topic that cannot support a ten-question session", () => {
    expect(
      filterCatalogForStudyAccess(catalog, [
        {
          exam_id: "20000000-0000-4000-8000-000000000001",
          topic_id: "40000000-0000-4000-8000-000000000011",
          available_question_count: 9,
        },
      ]),
    ).toEqual([]);
  });
});
