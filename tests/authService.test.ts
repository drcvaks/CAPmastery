import * as Linking from "expo-linking";

import { getSupabaseClient } from "../lib/supabase/client";
import { signUpWithPassword } from "../services/authService";

jest.mock("expo-linking", () => ({
  createURL: jest.fn(() => "capmastery://sign-in"),
}));
jest.mock("../lib/supabase/client", () => ({
  getSupabaseClient: jest.fn(),
}));

describe("signUpWithPassword", () => {
  it("creates only the Auth account and safe profile metadata", async () => {
    const signUp = jest.fn().mockResolvedValue({ data: { session: null }, error: null });
    jest.mocked(getSupabaseClient).mockReturnValue({ auth: { signUp } } as never);

    await expect(
      signUpWithPassword({
        email: "  NEWCADET@EXAMPLE.COM ",
        firstName: "  New ",
        lastName: " Cadet ",
        password: "securepass1",
      }),
    ).resolves.toEqual({ requiresEmailConfirmation: true });

    expect(Linking.createURL).toHaveBeenCalledWith("/sign-in");
    expect(signUp).toHaveBeenCalledWith({
      email: "newcadet@example.com",
      password: "securepass1",
      options: {
        data: {
          display_name: "New Cadet",
          first_name: "New",
          last_name: "Cadet",
        },
        emailRedirectTo: "capmastery://sign-in",
      },
    });
  });
});
