import { act, render, screen } from "@testing-library/react-native";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Text } from "react-native";

import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { getSupabaseClient, startNativeAuthAutoRefresh } from "../lib/supabase/client";
import { fetchAccessContext } from "../services/authService";

jest.mock("../lib/supabase/client", () => ({
  getSupabaseClient: jest.fn(),
  startNativeAuthAutoRefresh: jest.fn(() => jest.fn()),
}));
jest.mock("../services/authService", () => ({
  exchangeRecoveryUrl: jest.fn(),
  fetchAccessContext: jest.fn(),
  getSafeAuthMessage: jest.fn(() => "Authentication failed."),
  signOut: jest.fn(),
}));

const userId = "10000000-0000-4000-8000-000000000001";
const initialSession = {
  access_token: "initial-token",
  refresh_token: "refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: { id: userId },
} as Session;

function AuthState() {
  const auth = useAuth();
  return <Text>{`${auth.status}:${auth.access?.roles.join(",") ?? "none"}`}</Text>;
}

describe("AuthProvider session continuity", () => {
  it("keeps loaded access mounted when the same user's token refreshes", async () => {
    let authListener: ((event: AuthChangeEvent, session: Session | null) => void) | undefined;
    const unsubscribe = jest.fn();
    const getSession = jest
      .fn()
      .mockResolvedValue({ data: { session: initialSession }, error: null });
    (fetchAccessContext as jest.Mock).mockResolvedValue({
      profile: { id: userId },
      roles: ["student"],
    });
    (getSupabaseClient as jest.Mock).mockReturnValue({
      auth: {
        getSession,
        onAuthStateChange: (listener: typeof authListener) => {
          authListener = listener;
          return { data: { subscription: { unsubscribe } } };
        },
      },
    });

    await render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    );
    expect(await screen.findByText("signed_in:student")).toBeVisible();

    await act(() => {
      authListener?.("TOKEN_REFRESHED", {
        ...initialSession,
        access_token: "replacement-token",
      });
    });

    expect(screen.getByText("signed_in:student")).toBeVisible();
    expect(fetchAccessContext).toHaveBeenCalledTimes(1);
    expect(startNativeAuthAutoRefresh).toHaveBeenCalled();
  });
});
