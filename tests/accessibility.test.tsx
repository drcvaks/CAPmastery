import { fireEvent, render, screen } from "@testing-library/react-native";

import { AppButton } from "../components/common/AppButton";
import { AppTextField } from "../components/common/AppTextField";
import { RouteErrorBoundary } from "../components/common/RouteErrorBoundary";

describe("shared component accessibility", () => {
  it("keeps a loading button named and exposes its busy disabled state", async () => {
    await render(<AppButton label="Save question" loading onPress={jest.fn()} />);

    const button = screen.getByRole("button", { name: "Save question" });
    expect(button).toBeDisabled();
    expect(button).toHaveProp("accessibilityState", { busy: true, disabled: true });
  });

  it("associates validation guidance with a labeled text field", async () => {
    await render(<AppTextField label="Question prompt" error="A prompt is required." />);

    expect(screen.getByLabelText("Question prompt")).toHaveProp(
      "accessibilityHint",
      "A prompt is required.",
    );
    expect(screen.getByText("A prompt is required.")).toBeVisible();
  });

  it("hides raw route errors and offers a named retry action", async () => {
    const retry = jest.fn();
    const warning = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    await render(
      <RouteErrorBoundary
        error={new Error("private database detail and student@example.com")}
        retry={retry}
      />,
    );

    expect(screen.queryByText(/private database detail/i)).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Try loading the page again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith("CAP Mastery operational error", {
      area: "navigation",
      category: "unexpected",
      operation: "route-render",
    });
    warning.mockRestore();
  });
});
