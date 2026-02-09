import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role. Use only for operations that require
 * admin privileges (e.g. deleting a user). Never expose this client to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
