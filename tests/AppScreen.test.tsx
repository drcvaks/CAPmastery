import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppScreen } from "../components/common/AppScreen";
import { useOptionalAuth } from "../features/auth/AuthContext";

jest.mock("../features/auth/AuthContext", () => ({
  useOptionalAuth: jest.fn(),
}));
jest.mock("../features/auth/components/WorkspaceSwitcher", () => ({
  WorkspaceSwitcher: () => null,
}));

describe("AppScreen", () => {
  it("keeps the signed-in student's first name visible in the page header", async () => {
    jest.mocked(useOptionalAuth).mockReturnValue({
      status: "signed_in",
      access: {
        profile: {
          first_name: "Heshy",
          display_name: "Heshy Vaks",
        },
      },
    } as never);

    await render(
      <AppScreen eyebrow="Study session" title="Question session">
        <Text>Question content</Text>
      </AppScreen>,
    );

    expect(screen.getByText("Hello, Heshy")).toBeVisible();
    expect(screen.getByText("Question session")).toBeVisible();
  });
});
