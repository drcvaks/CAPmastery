import { render, screen } from "@testing-library/react-native";

import { StudySessionView } from "../features/study/components/StudySession";
import { useStudySession, useSubmitStudyAnswer } from "../features/study/hooks/useStudySession";
import {
  useCompletePracticeTest,
  usePracticeTestResults,
  useSetPracticeTestPaused,
} from "../features/practice/hooks/usePracticeTest";

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock("../features/study/hooks/useStudySession", () => ({
  useStudySession: jest.fn(),
  useSubmitStudyAnswer: jest.fn(),
}));
jest.mock("../features/practice/hooks/usePracticeTest", () => ({
  useCompletePracticeTest: jest.fn(),
  usePracticeTestResults: jest.fn(),
  useSetPracticeTestPaused: jest.fn(),
}));

const question = {
  session_id: "10000000-0000-4000-8000-000000000001",
  session_mode: "practice_test" as const,
  session_status: "active" as const,
  question_count: 10,
  answered_count: 1,
  correct_count: 0,
  timed: true,
  time_limit_seconds: 900,
  allow_pause: false,
  is_paused: false,
  remaining_seconds: 840,
  feedback_released: false,
  session_question_id: "20000000-0000-4000-8000-000000000001",
  question_position: 1,
  question_id: "30000000-0000-4000-8000-000000000001",
  question_text: "A protected practice question?",
  question_type: "multiple_choice" as const,
  difficulty: "easy" as const,
  cognitive_level: "recall" as const,
  source_reference: "Synthetic source",
  choices: [
    { id: "40000000-0000-4000-8000-000000000001", key: "A", text: "Choice A", sortOrder: 0 },
    { id: "40000000-0000-4000-8000-000000000002", key: "B", text: "Choice B", sortOrder: 1 },
  ],
  attempt_id: "50000000-0000-4000-8000-000000000001",
  selected_choice_id: "40000000-0000-4000-8000-000000000001",
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

const activeSession = {
  id: question.session_id,
  mode: "practice_test" as const,
  status: "active" as const,
  questionCount: 10,
  answeredCount: 1,
  correctCount: 0,
  timed: true,
  timeLimitSeconds: 900,
  allowPause: false,
  isPaused: false,
  remainingSeconds: 840,
  feedbackReleased: false,
  questions: [question],
};

beforeEach(() => {
  jest.mocked(useStudySession).mockReturnValue({
    data: activeSession,
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  jest.mocked(useSubmitStudyAnswer).mockReturnValue({ isPending: false, isError: false } as never);
  jest.mocked(useCompletePracticeTest).mockReturnValue({ isPending: false } as never);
  jest.mocked(useSetPracticeTestPaused).mockReturnValue({ isPending: false } as never);
  jest
    .mocked(usePracticeTestResults)
    .mockReturnValue({ isPending: false, isError: false } as never);
});

describe("practice test session", () => {
  it("shows a neutral saved state without correctness or explanation while active", async () => {
    await render(<StudySessionView sessionId={activeSession.id} />);

    expect(screen.getByText("Answer saved")).toBeVisible();
    expect(
      screen.getByText(
        "Correctness and explanations will be available when the practice test ends.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Correct.")).toBeNull();
    expect(screen.queryByText("Synthetic explanation")).toBeNull();
  });

  it("withholds challenge feedback until the student's set is complete", async () => {
    jest.mocked(useStudySession).mockReturnValue({
      data: { ...activeSession, mode: "challenge" },
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    await render(<StudySessionView sessionId={activeSession.id} />);

    expect(screen.getByText("Answer saved")).toBeVisible();
    expect(
      screen.getByText(
        "Correctness and explanations will be available after you finish your challenge set.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Correct.")).toBeNull();
  });

  it("shows topic strengths and weaknesses only after completion", async () => {
    jest.mocked(useStudySession).mockReturnValue({
      data: {
        ...activeSession,
        status: "completed",
        correctCount: 7,
        answeredCount: 10,
        feedbackReleased: true,
        questions: [{ ...question, session_status: "completed" }],
      },
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);
    jest.mocked(usePracticeTestResults).mockReturnValue({
      data: [
        {
          topic_id: "60000000-0000-4000-8000-000000000001",
          topic_title: "Core Values",
          question_count: 10,
          answered_count: 10,
          correct_count: 7,
          score_percent: 70,
          performance_label: "Developing",
        },
      ],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    await render(<StudySessionView sessionId={activeSession.id} />);

    expect(screen.getByText("Practice test complete")).toBeVisible();
    expect(screen.getByText("Topic analysis")).toBeVisible();
    expect(screen.getByText("Core Values")).toBeVisible();
    expect(screen.getByText("Unofficial study result—not an official CAP result.")).toBeVisible();
  });
});
