"use server";

import { createClient } from "@/lib/supabase/server";

// Server-side auth helpers (e.g. for future use)
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
