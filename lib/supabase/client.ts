import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";

import type { Database } from "../../types/database";
import { readSupabaseConfiguration } from "../validation/environment";

let client: SupabaseClient<Database> | undefined;

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  const environment = readSupabaseConfiguration();
  if (!environment.ok) {
    throw new SupabaseConfigurationError(environment.message);
  }

  client = createClient<Database>(
    environment.configuration.supabaseUrl,
    environment.configuration.supabasePublishableKey,
    {
      auth: {
        ...(Platform.OS === "web" ? {} : { storage: AsyncStorage }),
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === "web",
        lock: processLock,
        persistSession: true,
      },
    },
  );

  return client;
}

export function startNativeAuthAutoRefresh(supabase: SupabaseClient<Database>) {
  if (Platform.OS === "web") {
    return () => undefined;
  }

  if (AppState.currentState === "active") {
    supabase.auth.startAutoRefresh();
  }

  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}
