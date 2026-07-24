import { createChallengeSchema, groupChallengeRows } from "../features/challenges/schemas";

const baseRow = {
  challenge_id: "10000000-0000-4000-8000-000000000001",
  title: "Family Study Challenge",
  exam_id: "20000000-0000-4000-8000-000000000001",
  exam_title: "Leadership",
  challenge_status: "active" as const,
  question_count: 5,
  starts_at: "2026-07-24T12:00:00+00:00",
  ends_at: "2026-07-31T12:00:00+00:00",
  created_by: "30000000-0000-4000-8000-000000000001",
  can_manage: true,
  participant_completed: false,
  results_revealed: false,
  score_percent: null,
  improvement_percent: null,
  total_points: null,
  recognition: null,
};

describe("challenge schemas", () => {
  it("groups the two private participant rows while preserving hidden results", () => {
    const challenges = groupChallengeRows([
      {
        ...baseRow,
        participant_student_id: "40000000-0000-4000-8000-000000000001",
        participant_name: "Student One",
        participant_session_id: "50000000-0000-4000-8000-000000000001",
      },
      {
        ...baseRow,
        participant_student_id: "40000000-0000-4000-8000-000000000002",
        participant_name: "Student Two",
        participant_session_id: "50000000-0000-4000-8000-000000000002",
      },
    ]);

    expect(challenges).toHaveLength(1);
    expect(challenges[0]?.participants).toHaveLength(2);
    expect(
      challenges[0]?.participants.every((participant) => participant.scorePercent === null),
    ).toBe(true);
  });

  it("requires exactly two distinct students", () => {
    expect(
      createChallengeSchema.safeParse({
        title: "Family challenge",
        examId: baseRow.exam_id,
        studentIds: [
          "40000000-0000-4000-8000-000000000001",
          "40000000-0000-4000-8000-000000000001",
        ],
        questionCount: 5,
      }).success,
    ).toBe(false);
  });
});
