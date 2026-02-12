import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/;
const SEX_VALUES = ["male", "female", "other", "prefer_not_to_say"] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, display_name, age, sex, avatar_url, notify_partner_request, notify_partner_online, timezone")
    .eq("id", user.id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? {});
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : undefined;
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : undefined;
  const age = typeof body.age === "number" ? body.age : typeof body.age === "string" ? parseInt(body.age, 10) : undefined;
  const sex = typeof body.sex === "string" && SEX_VALUES.includes(body.sex as (typeof SEX_VALUES)[number]) ? body.sex : undefined;
  const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url.trim() || null : undefined;
  const notifyPartnerRequest = typeof body.notify_partner_request === "boolean" ? body.notify_partner_request : undefined;
  const notifyPartnerOnline = typeof body.notify_partner_online === "boolean" ? body.notify_partner_online : undefined;
  const timezone = typeof body.timezone === "string" ? body.timezone.trim() || null : undefined;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (username !== undefined) {
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–30 characters, letters, numbers, underscores or hyphens only." },
        { status: 400 }
      );
    }
    updates.username = username.toLowerCase();
  }
  if (fullName !== undefined) updates.full_name = fullName || null;
  if (age !== undefined) updates.age = age >= 1 && age <= 120 ? age : null;
  if (sex !== undefined) updates.sex = sex;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
  if (notifyPartnerRequest !== undefined) updates.notify_partner_request = notifyPartnerRequest;
  if (notifyPartnerOnline !== undefined) updates.notify_partner_online = notifyPartnerOnline;
  if (timezone !== undefined) updates.timezone = timezone;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, username, full_name, age, sex, display_name, avatar_url, notify_partner_request, notify_partner_online, timezone")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
