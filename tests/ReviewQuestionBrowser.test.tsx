import { fireEvent, render, screen } from "@testing-library/react-native";
import { ReviewQuestionBrowser } from "../features/admin/components/ReviewQuestionBrowser";
import { reviewQueueItemSchema } from "../features/admin/schemas";
const questions = Array.from({ length: 125 }, (_, i) =>
  reviewQueueItemSchema.parse({
    question_id: `81000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    external_id: `TEST-Q${String(i + 1).padStart(3, "0")}`,
    question_text: `Synthetic prompt ${i + 1}?`,
    exam_title: "Billy Mitchell Aerospace",
    module_number: 1,
    chapter_number: 2,
    topic_title: "Synthetic chapter",
    review_status: i === 124 ? "approved" : "draft",
    version: 1,
    updated_at: "2026-11-03",
  }),
);
it("starts collapsed, nests module/chapter menus, and reveals additional question pages", async () => {
  const select = jest.fn();
  await render(<ReviewQuestionBrowser questions={questions} onSelect={select} />);
  expect(screen.queryByText("Synthetic prompt 1?")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Expand Billy Mitchell Aerospace" }));
  await fireEvent.press(screen.getByRole("button", { name: "Expand Module 1" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Expand Chapter 2 · Synthetic chapter" }),
  );
  expect(screen.getByRole("button", { name: "Review TEST-Q020" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Review TEST-Q021" })).toBeNull();
  await fireEvent.press(screen.getByText("Show next 20 questions"));
  await fireEvent.press(screen.getByRole("button", { name: "Review TEST-Q021" }));
  expect(select).toHaveBeenCalledWith(questions[20]?.question_id);
});
it("can find a question beyond the old first-100 limit and filter its status", async () => {
  await render(<ReviewQuestionBrowser questions={questions} onSelect={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText("Search questions or chapters"), "TEST-Q125");
  expect(screen.getByText(/1 of 125 questions/)).toBeVisible();
  await fireEvent.press(screen.getByRole("button", { name: "approved" }));
  expect(screen.getByText(/1 of 125 questions/)).toBeVisible();
  await fireEvent.press(screen.getByRole("button", { name: "draft" }));
  expect(screen.getByText("No questions match these filters.")).toBeVisible();
});
