import { fireEvent, renderRouter, screen, waitFor } from "expo-router/testing-library";
import { Text } from "react-native";

import SignUpScreen from "../app/(auth)/sign-up";
import { signUpWithPassword } from "../services/authService";

jest.mock("../services/authService", () => ({
  getSafeAuthMessage: jest.fn(() => "Account creation failed."),
  signUpWithPassword: jest.fn(),
}));

describe("SignUpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an account and explains the approval step", async () => {
    jest.mocked(signUpWithPassword).mockResolvedValue({ requiresEmailConfirmation: true });

    await renderRouter(
      {
        "sign-in": () => <Text>Existing account sign in</Text>,
        "sign-up": SignUpScreen,
      },
      { initialUrl: "/sign-up" },
    );

    await fireEvent.changeText(screen.getByLabelText("First name"), "  New  ");
    await fireEvent.changeText(screen.getByLabelText("Last name (optional)"), "Cadet");
    await fireEvent.changeText(screen.getByLabelText("Email"), "  NEWCADET@EXAMPLE.COM ");
    await fireEvent.changeText(screen.getByLabelText("Password"), "securepass1");
    await fireEvent.changeText(screen.getByLabelText("Confirm password"), "securepass1");

    await fireEvent.press(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(signUpWithPassword).toHaveBeenCalledWith({
        email: "newcadet@example.com",
        firstName: "New",
        lastName: "Cadet",
        password: "securepass1",
      }),
    );
    expect(screen.getByRole("header", { name: "Check your email" })).toBeVisible();
    expect(
      screen.getByText(
        "After confirming your email, an administrator must assign your Student workspace and study packets.",
      ),
    ).toBeVisible();
  });
});
