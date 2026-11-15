import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StudyIssueForm } from "../features/study/components/StudyIssueForm";
import { submitStudyIssue } from "../services/studyIssueService";

jest.mock("../services/studyIssueService", () => ({ submitStudyIssue: jest.fn() }));

it("discloses identity sharing and submits multiple categories with the required Other note", async () => {
  const client = new QueryClient();
  jest.mocked(submitStudyIssue).mockResolvedValue(undefined);
  await render(
    <QueryClientProvider client={client}>
      <StudyIssueForm id="session-question" prompt="Original prompt" />
    </QueryClientProvider>,
  );
  await fireEvent.press(screen.getByLabelText("Report an issue"));
  expect(screen.getByText(/admins can see your name/)).toBeVisible();
  expect(screen.getByText("Original prompt")).toBeVisible();
  await fireEvent.press(screen.getByLabelText("Image"));
  await fireEvent.press(screen.getByLabelText("Other"));
  expect(screen.getByLabelText("Send report")).toBeDisabled();
  await fireEvent.changeText(
    screen.getByLabelText("Details (required for Other)"),
    "Check the labels.",
  );
  await fireEvent.press(screen.getByLabelText("Send report"));
  expect(await screen.findByText(/Report received/)).toBeVisible();
  expect(submitStudyIssue).toHaveBeenCalledWith(
    "session-question",
    ["image", "other"],
    "Check the labels.",
  );
  client.clear();
});
