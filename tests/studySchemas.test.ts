import { getSafeStudyMessage } from "../features/study/errors";
import { parseAnswerSubmission, parseStudySessionRows } from "../features/study/schemas";

const sessionRow = {
  session_id: "10000000-0000-4000-8000-000000000001",
  session_status: "active",
  question_count: 10,
  answered_count: 0,
  correct_count: 0,
  session_question_id: "20000000-0000-4000-8000-000000000001",
  question_position: 1,
  question_id: "30000000-0000-4000-8000-000000000001",
  question_text: "Synthetic question?",
  question_type: "multiple_choice",
  difficulty: "easy",
  cognitive_level: "recall",
  source_reference: "Synthetic source",
  choices: [
    {
      id: "40000000-0000-4000-8000-000000000001",
      key: "A",
      text: "Synthetic choice",
      sortOrder: 0,
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      key: "B",
      text: "Synthetic choice two",
      sortOrder: 1,
    },
  ],
  attempt_id: null,
  selected_choice_id: null,
  is_correct: null,
  correct_choice_id: null,
  explanation: null,
  selected_choice_feedback: null,
  remediation: null,
  common_mistake: null,
  short_explanation: null,
  feedback_display_version: null,
  memory_aid: null,
  visual_asset_key: null,
  visual_caption: null,
  visual_alt_text: null,
  visual_storage_path: null,
  visual_mime_type: null,
  visual_width: null,
  visual_height: null,
  visual_uri: null,
};

describe("study schemas", () => {
  it("parses an unanswered session without answer material", () => {
    const session = parseStudySessionRows([sessionRow]);
    expect(session.questionCount).toBe(10);
    expect(session.questions[0]?.correct_choice_id).toBeNull();
  });

  it("rejects a correctness field smuggled into a delivered choice", () => {
    expect(() =>
      parseStudySessionRows([
        {
          ...sessionRow,
          choices: [{ ...sessionRow.choices[0], isCorrect: true }, sessionRow.choices[1]],
        },
      ]),
    ).toThrow();
  });

  it("parses one server grading result", () => {
    const result = parseAnswerSubmission([
      {
        attempt_id: "50000000-0000-4000-8000-000000000001",
        is_correct: true,
        correct_choice_id: "40000000-0000-4000-8000-000000000001",
        explanation: "Synthetic explanation",
        selected_choice_feedback: null,
        remediation: "Synthetic remediation",
        common_mistake: null,
        source_reference: "Synthetic source",
        session_completed: false,
        answered_count: 1,
        question_count: 10,
        correct_count: 1,
      },
    ]);
    expect(result.is_correct).toBe(true);
  });
});

describe("study errors", () => {
  it("provides an actionable offline message without leaking backend details", () => {
    expect(getSafeStudyMessage(new Error("network fetch failed at internal host"))).toBe(
      "CAP Mastery could not reach the study service. Check your connection and try again.",
    );
  });

  it("explains a sparse approved bank", () => {
    expect(
      getSafeStudyMessage(new Error("Not enough approved questions for a 10 question session")),
    ).toBe("This track does not yet have 10 approved questions.");
  });

  it("reads the plain error-object shape returned by Supabase RPC", () => {
    expect(
      getSafeStudyMessage({
        code: "22023",
        details: null,
        hint: null,
        message: "Not enough approved questions for a 10 question session",
      }),
    ).toBe("This track does not yet have 10 approved questions.");
  });
});
