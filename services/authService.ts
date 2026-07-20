import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

import type { AccessContext } from "../features/auth/types";
import { getSupabaseClient } from "../lib/supabase/client";

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) {
    throw error;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email, {
    redirectTo: Linking.createURL("/reset-password"),
  });
  if (error) {
    throw error;
  }
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) {
    throw error;
  }
}

export async function fetchAccessContext(userId: string): Promise<AccessContext> {
  const supabase = getSupabaseClient();
  const [profileResult, rolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, first_name, last_name, avatar_url, status, created_at, updated_at")
      .eq("id", userId)
      .single(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }
  if (rolesResult.error) {
    throw rolesResult.error;
  }
  if (profileResult.data.status !== "active") {
    throw new Error("This CAP Mastery profile is disabled.");
  }

  return {
    profile: profileResult.data,
    roles: rolesResult.data.map(({ role }) => role),
  };
}

export async function exchangeRecoveryUrl(url: string): Promise<Session | null> {
  const parsed = new URL(url);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const code = parsed.searchParams.get("code");
  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");

  if (code) {
    const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return data.session;
  }

  if (accessToken && refreshToken) {
    const { data, error } = await getSupabaseClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      throw error;
    }
    return data.session;
  }

  return null;
}

export function getSafeAuthMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }
  if (message.includes("rate limit")) {
    return "Too many attempts. Please wait before trying again.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "CAP Mastery could not reach the sign-in service. Check your connection and try again.";
  }

  return "The authentication request could not be completed. Please try again.";
}
