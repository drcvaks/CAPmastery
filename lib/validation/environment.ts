import { z } from "zod";

const publicEnvironmentSchema = z.object({
  supabasePublishableKey: z.string().trim().min(20),
  supabaseUrl: z.url().refine((value) => {
    const hostname = new URL(value).hostname;
    return (
      hostname === "127.0.0.1" || hostname === "localhost" || hostname.endsWith(".supabase.co")
    );
  }, "Use a Supabase project URL or the local Supabase URL."),
});

export type SupabaseConfiguration = z.infer<typeof publicEnvironmentSchema>;

export type EnvironmentResult =
  { configuration: SupabaseConfiguration; ok: true } | { message: string; ok: false };

export function readSupabaseConfiguration(): EnvironmentResult {
  const result = publicEnvironmentSchema.safeParse({
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  });

  if (result.success) {
    return { configuration: result.data, ok: true };
  }

  return {
    message:
      "CAP Mastery needs its own Supabase project URL and publishable key in the ignored .env.local file.",
    ok: false,
  };
}
