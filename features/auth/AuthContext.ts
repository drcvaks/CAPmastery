import type { Session } from "@supabase/supabase-js";
import { createContext, useContext } from "react";

import type { AccessContext } from "./types";

export type AuthStatus = "configuration_missing" | "error" | "loading" | "signed_in" | "signed_out";

export type AuthContextValue = {
  access: AccessContext | null;
  completePasswordRecovery: () => void;
  errorMessage: string | null;
  passwordRecovery: boolean;
  refreshAccess: () => Promise<void>;
  session: Session | null;
  signOut: () => Promise<void>;
  status: AuthStatus;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useOptionalAuth();
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return value;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
