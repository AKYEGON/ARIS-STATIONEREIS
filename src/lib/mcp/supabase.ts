import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy: never read env at module top-level (mcp-js evaluates this file at
// build-time manifest extraction and again on Deno cold start).
export function getPublicClient(): SupabaseClient {
  const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
