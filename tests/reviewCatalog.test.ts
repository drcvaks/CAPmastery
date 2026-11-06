import { groupReviewQuestions } from "../features/admin/reviewCatalog";
import { reviewQueueItemSchema } from "../features/admin/schemas";

const question = reviewQueueItemSchema.parse({
  question_id: "81000000-0000-4000-8000-000000000001",
  external_id: "Q001",
  question_text: "Synthetic question?",
  exam_title: "Wright Brothers",
  topic_title: "Chapter one",
  review_status: "draft",
  version: 1,
  updated_at: "2026-11-03",
});
it("orders milestone tests and naturally sorts numbered chapters", () => {
  const groups = groupReviewQuestions([
    { ...question, exam_title: "Earhart" },
    { ...question, exam_title: "Billy Mitchell Aerospace", module_number: 2 },
    { ...question, chapter_number: 10 },
    { ...question, chapter_number: 2 },
    { ...question, exam_title: "Billy Mitchell Leadership" },
  ]);
  expect(groups.map((group) => group.title)).toEqual([
    "Wright Brothers",
    "Billy Mitchell Leadership",
    "Billy Mitchell Aerospace",
    "Earhart",
  ]);
  expect(groups[0]?.children.map((group) => group.title)).toEqual([
    "Chapter 2 · Chapter one",
    "Chapter 10 · Chapter one",
  ]);
});
it("nests Aerospace chapters inside modules and preserves every question", () => {
  const data = Array.from({ length: 125 }, (_, i) => ({
    ...question,
    external_id: `Q${i}`,
    module_number: i < 100 ? 1 : 2,
    chapter_number: 1,
  }));
  const group = groupReviewQuestions(data)[0]!;
  expect(group.count).toBe(125);
  expect(group.children).toHaveLength(2);
  expect(group.children[0]?.children[0]?.questions).toHaveLength(100);
  expect(group.children[1]?.children[0]?.questions).toHaveLength(25);
});
it("uses topic labels when chapter metadata is absent", () => {
  expect(groupReviewQuestions([question])[0]?.children[0]?.title).toBe("Chapter one");
});
