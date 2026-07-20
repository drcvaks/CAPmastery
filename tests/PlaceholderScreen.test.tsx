import { render, screen } from "@testing-library/react-native";

import { PlaceholderScreen } from "../features/shell/components/PlaceholderScreen";

describe("PlaceholderScreen", () => {
  it("explains which checkpoint owns the feature", async () => {
    await render(
      <PlaceholderScreen
        area="Student"
        title="Study"
        description="Study shell description"
        checkpoint="Checkpoint 4"
      />,
    );

    expect(screen.getByRole("header", { name: "Study" })).toBeVisible();
    expect(screen.getByText("Study shell description")).toBeVisible();
    expect(screen.getByText("Planned for Checkpoint 4")).toBeVisible();
  });
});
