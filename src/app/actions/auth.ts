"use server";

import { createClient } from "@/lib/supabase/server";

export async function loginWithMagicLink(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const origin = (formData.get("origin") as string) || process.env.NEXT_PUBLIC_APP_URL;
  const next = (formData.get("next") as string)?.trim() || "/dashboard";

  if (!email) {
    return { error: "Email is required." };
  }

  const redirectTo = origin
    ? `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
    : undefined;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
