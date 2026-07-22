import { act, fireEvent, render, screen, within } from "@testing-library/react-native";

import { AnswerResultCard } from "../features/study/components/AnswerResultCard";

describe("AnswerResultCard", () => {
  it("keeps optional learning support hidden until the student requests it", async () => {
    await render(
      <AnswerResultCard
        explanation="A fuller explanation with added teaching detail."
        isCorrect
        memoryAid="A short memory cue."
        nextLabel="Next question"
        onNext={jest.fn()}
        remediation="Extra remediation guidance."
        selectedChoiceFeedback="A concise explanation."
        shortExplanation="The short reviewed explanation."
        sourceReference="Learn to Lead, page 7"
        visual={null}
      />,
    );

    expect(screen.getByRole("header", { name: "Correct." })).toBeVisible();
    expect(screen.getByText("The short reviewed explanation.")).toBeVisible();
    expect(screen.queryByText("A fuller explanation with added teaching detail.")).toBeNull();
    expect(screen.queryByText("Extra remediation guidance.")).toBeNull();
    expect(screen.queryByText("A short memory cue.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Show visual" })).toBeNull();
    expect(screen.getByText("Source: Learn to Lead, page 7")).toBeVisible();

    await act(() => fireEvent.press(screen.getByRole("button", { name: "Memory trick" })));
    expect(screen.getByText("A short memory cue.")).toBeVisible();
    expect(
      within(screen.getByTestId("memory-support")).getByText("A short memory cue."),
    ).toBeVisible();
    expect(within(screen.getByTestId("memory-support")).queryByText("Explain more")).toBeNull();

    await act(() => fireEvent.press(screen.getByRole("button", { name: "Explain more" })));
    expect(screen.getByText("A fuller explanation with added teaching detail.")).toBeVisible();
    expect(screen.getByText("Extra remediation guidance.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Hide explanation" })).toBeVisible();
  });
});
