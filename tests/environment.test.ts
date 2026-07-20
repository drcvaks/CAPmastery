import { readSupabaseConfiguration } from "../lib/validation/environment";

describe("Supabase environment validation", () => {
  const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  afterEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });

  it("rejects missing CAP Mastery configuration", () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(readSupabaseConfiguration().ok).toBe(false);
  });

  it("accepts a project URL and publishable key", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example-project.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example_key_value";

    expect(readSupabaseConfiguration().ok).toBe(true);
  });

  it("rejects a URL outside Supabase or local development", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.com";
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example_key_value";

    expect(readSupabaseConfiguration().ok).toBe(false);
  });
});
