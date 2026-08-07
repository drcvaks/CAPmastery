import { render, screen, userEvent } from "@testing-library/react-native";

import { ProgressDashboard } from "../features/progress/components/ProgressDashboard";
import { useProgressDashboard, useProgressStudents } from "../features/progress/hooks/useProgress";
import { useCreateStudySession } from "../features/study/hooks/useStudySession";

jest.mock("../features/progress/hooks/useProgress", () => ({
  useProgressDashboard: jest.fn(),
  useProgressStudents: jest.fn(),
}));
jest.mock("../features/study/hooks/useStudySession", () => ({
  useCreateStudySession: jest.fn(),
}));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("../features/auth/components/SignOutButton", () => ({
  SignOutButton: () => null,
}));

const mockedStudents = jest.mocked(useProgressStudents);
const mockedDashboard = jest.mocked(useProgressDashboard);
const mockedCreateStudySession = jest.mocked(useCreateStudySession);
const mutateAsync = jest.fn().mockResolvedValue("a6666666-6666-4666-8666-666666666666");

const exam = {
  student_id: "a1111111-1111-4111-8111-111111111111",
  student_name: "Student One",
  exam_id: "a2222222-2222-4222-8222-222222222222",
  exam_title: "Leadership",
  eligible_question_count: 30,
  attempted_question_count: 5,
  topic_count: 2,
  practiced_topic_count: 1,
  coverage_score: 16.67,
  recent_accuracy_score: 80,
  mastery_score: 55,
  retention_score: 48,
  weak_topic_count: 1,
  due_question_count: 2,
  readiness_score: 40,
  readiness_label: "Developing" as const,
  recommended_topic_id: "a3333333-3333-4333-8333-333333333333",
  recommended_topic_title: "Core Values",
  recommended_action: "Review 2 questions due now.",
  topics: [
    {
      topic_id: "a3333333-3333-4333-8333-333333333333",
      topic_title: "Core Values",
      eligible_question_count: 15,
      attempted_question_count: 5,
      attempts_count: 5,
      correct_count: 3,
      accuracy_score: 60,
      mastery_score: 32,
      confidence_score: 35,
      retention_score: 30,
      status: "needs_review" as const,
      due_question_count: 2,
      last_practiced_at: "2026-07-21T12:00:00.000Z",
      next_review_at: "2026-07-22T12:00:00.000Z",
      recommended: true,
    },
  ],
  trends: [
    {
      trend_date: "2026-07-21",
      questions_answered: 5,
      correct_count: 3,
      accuracy_score: 60,
    },
  ],
  latestPracticeTopics: [
    {
      session_id: "a5555555-5555-4555-8555-555555555555",
      completed_at: "2026-08-02T12:00:00.000Z",
      topic_id: "a3333333-3333-4333-8333-333333333333",
      topic_title: "Learn to Lead, Volume 2, Chapter 4",
      question_count: 10,
      answered_count: 10,
      correct_count: 6,
      score_percent: 60,
      performance_label: "Developing" as const,
    },
  ],
  latestPracticeReview: {
    session_id: "a5555555-5555-4555-8555-555555555555",
    tracking_available: true,
    missed_count: 4,
    reviewed_count: 2,
    review_percent: 50,
    review_complete: false,
    reviewed_session_question_ids: ["a7777777-7777-4777-8777-777777777777"],
  },
};

beforeEach(() => {
  mockPush.mockClear();
  mutateAsync.mockClear();
  mockedCreateStudySession.mockReturnValue({
    mutateAsync,
    isError: false,
  } as never);
  mockedStudents.mockReturnValue({
    data: [
      { student_id: exam.student_id, display_name: "Student One" },
      { student_id: "a4444444-4444-4444-8444-444444444444", display_name: "Student Two" },
    ],
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
  mockedDashboard.mockReturnValue({
    data: [exam],
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  } as never);
});

describe("ProgressDashboard", () => {
  it("shows zero and not started when no questions have been answered", async () => {
    mockedDashboard.mockReturnValue({
      data: [
        {
          ...exam,
          attempted_question_count: 0,
          readiness_score: 0,
          readiness_label: "Not started",
          recommended_action: "Start a 10-question study session.",
        },
      ],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    await render(<ProgressDashboard audience="student" />);

    expect(await screen.findByText("0%")).toBeVisible();
    expect(screen.getByText("Not started")).toBeVisible();
  });

  it("shows coverage-capped readiness, weak topics, trends, and the disclaimer", async () => {
    await render(<ProgressDashboard audience="student" />);

    expect(await screen.findByText("40%")).toBeVisible();
    expect(screen.getByText("Developing")).toBeVisible();
    expect(screen.getByText("Review 2 questions due now.")).toBeVisible();
    expect(screen.getByText("Core Values")).toBeVisible();
    expect(screen.getByText("Latest full practice test")).toBeVisible();
    expect(screen.getByText("Missed-answer review: 2 of 4 (50%)")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start Chapter 4 study" })).toBeVisible();
    expect(screen.getByText("30-day trend")).toBeVisible();
    expect(screen.getByText("This is a study estimate, not an official CAP result.")).toBeVisible();
  });

  it("starts the selected chapter session directly from latest test analysis", async () => {
    await render(<ProgressDashboard audience="student" />);
    const user = userEvent.setup();

    await user.press(screen.getByRole("button", { name: "Start Chapter 4 study" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      examId: exam.exam_id,
      topicId: exam.latestPracticeTopics[0]!.topic_id,
    });
    expect(mockPush).toHaveBeenCalledWith("/study/session/a6666666-6666-4666-8666-666666666666");
  });

  it("shows every authorized linked student in the guardian selector", async () => {
    await render(<ProgressDashboard audience="guardian" />);

    expect(await screen.findByRole("tab", { name: "Student One" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Student Two" })).toBeVisible();
    expect(screen.getByText("Family progress")).toBeVisible();
  });

  it("keeps the student home summary compact", async () => {
    await render(<ProgressDashboard audience="student" compact />);

    expect(await screen.findByText("Recommended next step")).toBeVisible();
    expect(screen.queryByText("Topic detail")).toBeNull();
    expect(screen.queryByText("30-day trend")).toBeNull();
  });
});
