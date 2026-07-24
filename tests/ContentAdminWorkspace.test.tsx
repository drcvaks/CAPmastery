import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { ContentAdminWorkspace } from "../features/admin/components/ContentAdminWorkspace";
import * as adminHooks from "../features/admin/hooks/useContentAdmin";

jest.mock("../features/admin/hooks/useContentAdmin", () => ({
  useDuplicateCheck: jest.fn(),
  useQuestionCsvImport: jest.fn(),
  useReviewQueue: jest.fn(),
  useReviewQuestion: jest.fn(),
  useSaveReviewQuestion: jest.fn(),
  useSubmitQuestionReview: jest.fn(),
}));
jest.mock("../features/auth/components/SignOutButton", () => ({
  SignOutButton: () => null,
}));

const questionId = "81000000-0000-4000-8000-000000000001";
const choiceIds = [
  "82000000-0000-4000-8000-000000000001",
  "82000000-0000-4000-8000-000000000002",
  "82000000-0000-4000-8000-000000000003",
  "82000000-0000-4000-8000-000000000004",
];

function mutation(data?: unknown) {
  return {
    data,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: false,
    mutateAsync: jest.fn(),
    reset: jest.fn(),
  } as never;
}

beforeEach(() => {
  jest.mocked(adminHooks.useDuplicateCheck).mockReturnValue(mutation());
  jest.mocked(adminHooks.useQuestionCsvImport).mockReturnValue(mutation());
  jest.mocked(adminHooks.useReviewQueue).mockReturnValue({
    data: [
      {
        question_id: questionId,
        external_id: "CHECKPOINT8-Q001",
        question_text: "What should a reviewer verify?",
        exam_title: "Leadership",
        topic_title: "Review topic",
        review_status: "draft",
        version: 1,
        updated_at: "2026-07-22T12:00:00Z",
      },
    ],
    isPending: false,
    isError: false,
  } as never);
  jest.mocked(adminHooks.useReviewQuestion).mockReturnValue({
    data: {
      question: {
        id: questionId,
        external_id: "CHECKPOINT8-Q001",
        question_text: "What should a reviewer verify?",
        difficulty: "medium",
        cognitive_level: "understanding",
        source_reference: "Authorized source, page 1",
        source_page_start: 1,
        source_page_end: 1,
        estimated_time_seconds: 30,
        review_status: "draft",
        version: 1,
      },
      choices: choiceIds.map((id, index) => ({
        id,
        key: String.fromCharCode(65 + index),
        text: `Choice ${index + 1}`,
        sort_order: index,
        feedback: `Feedback ${index + 1}`,
      })),
      answer: {
        correct_choice_id: choiceIds[0],
        explanation: "Review accuracy, clarity, and source alignment.",
        remediation: null,
        common_mistake: null,
      },
      learning_support: null,
    },
    isError: false,
    isPending: false,
  } as never);
  jest.mocked(adminHooks.useSaveReviewQuestion).mockReturnValue(mutation());
  jest.mocked(adminHooks.useSubmitQuestionReview).mockReturnValue(mutation());
});

describe("ContentAdminWorkspace", () => {
  it("loads the canonical template and reports invalid pasted CSV before import", async () => {
    await render(<ContentAdminWorkspace />);
    await act(() => fireEvent.press(screen.getByText("Load blank template")));
    expect(screen.getByLabelText("CSV content").props.value).toContain("external_id,pilot_batch");
    await act(() =>
      fireEvent.changeText(screen.getByLabelText("CSV content"), "wrong,headers\n1,2"),
    );
    await act(() => fireEvent.press(screen.getByText("Validate and preview")));
    expect(screen.getByText(/Missing required columns/)).toBeVisible();
    expect(screen.getByText("Import all rows as drafts")).toBeDisabled();
  });

  it("opens a draft in the shared reviewer editor without exposing student data", async () => {
    await render(<ContentAdminWorkspace />);
    await act(() => fireEvent.press(screen.getByText("Review questions")));
    await act(() => fireEvent.press(screen.getByText("What should a reviewer verify?")));
    expect(
      screen.getByText("draft · version 1. Review decisions save the displayed corrections first."),
    ).toBeVisible();
    expect(screen.getByLabelText("Correct letter").props.value).toBe("A");
    expect(screen.getByText("Approve for students")).toBeVisible();
    expect(screen.getByText("Back to review queue")).toBeVisible();
    expect(screen.queryByText("Review queue")).toBeNull();
    expect(screen.queryByText(/student progress/i)).toBeNull();
    await act(() => fireEvent.press(screen.getByText("Back to review queue")));
    expect(screen.getByText("Review queue")).toBeVisible();
  });
});
