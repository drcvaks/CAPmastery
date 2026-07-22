import { topicProgressSchema } from "../features/progress/schemas";

const topicProgress = {
  topic_id: "c4000000-0000-4000-8000-000000000001",
  topic_title: "Leadership foundations",
  eligible_question_count: 30,
  attempted_question_count: 10,
  attempts_count: 12,
  correct_count: 9,
  accuracy_score: 75,
  mastery_score: 64,
  confidence_score: 55,
  retention_score: 60,
  status: "developing",
  due_question_count: 2,
  last_practiced_at: "2026-07-21T12:34:56.123456+00:00",
  next_review_at: "2026-07-23T12:34:56+00:00",
  recommended: true,
};

describe("progress schemas", () => {
  it("accepts PostgreSQL timestamps with timezone offsets", () => {
    expect(topicProgressSchema.parse(topicProgress)).toEqual(topicProgress);
  });

  it("continues to reject timestamps without a timezone", () => {
    expect(
      topicProgressSchema.safeParse({
        ...topicProgress,
        last_practiced_at: "2026-07-21T12:34:56",
      }).success,
    ).toBe(false);
  });
});
