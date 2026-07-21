import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { AnswerResultCard } from "../features/study/components/AnswerResultCard";

describe("AnswerResultCard", () => {
  it("keeps remediation hidden until the student asks for help", async () => {
    await render(
      <AnswerResultCard
        explanation="A concise explanation."
        isCorrect
        nextLabel="Next question"
        onNext={jest.fn()}
        remediation="Extra remediation guidance."
        selectedChoiceFeedback="A concise explanation."
        sourceReference="Learn to Lead, page 7"
      />,
    );

    expect(screen.getByRole("header", { name: "Correct." })).toBeVisible();
    expect(screen.queryByText("Extra remediation guidance.")).toBeNull();
    expect(screen.getByText("Source: Learn to Lead, page 7")).toBeVisible();

    await act(() => fireEvent.press(screen.getByRole("button", { name: "Need more help?" })));
    expect(screen.getByText("Extra remediation guidance.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hide extra help" })).toBeVisible();
  });
});
