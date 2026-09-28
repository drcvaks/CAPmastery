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

  it("opens a full-screen visual with accessible zoom controls", async () => {
    await render(
      <AnswerResultCard
        explanation="A fuller explanation."
        isCorrect
        memoryAid={null}
        nextLabel="Next question"
        onNext={jest.fn()}
        remediation={null}
        selectedChoiceFeedback="A concise explanation."
        shortExplanation="The short reviewed explanation."
        sourceReference="Learn to Lead, page 7"
        visual={{
          altText: "A detailed leadership poster",
          caption: "Leadership concepts poster",
          height: 1086,
          uri: "https://example.test/leadership-poster.png",
          width: 1448,
        }}
      />,
    );

    await act(() => fireEvent.press(screen.getByRole("button", { name: "Show visual" })));
    expect(screen.getByTestId("visual-aid-image")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open visual full screen" })).toBeVisible();

    await act(() =>
      fireEvent.press(screen.getByRole("button", { name: "Open visual full screen" })),
    );
    expect(screen.getByTestId("full-screen-visual-viewer")).toBeVisible();
    expect(screen.getByText("100%")).toBeVisible();

    await act(() => fireEvent.press(screen.getByRole("button", { name: "Zoom in" })));
    expect(screen.getByText("150%")).toBeVisible();

    await act(() => fireEvent.press(screen.getByRole("button", { name: "Close visual" })));
    expect(screen.queryByTestId("full-screen-visual-viewer")).toBeNull();
  });
});
