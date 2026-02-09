import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const confirm = typeof body.confirm === "string" ? body.confirm.trim().toUpperCase() : "";
  if (confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Please type DELETE to confirm permanent account deletion.' },
      { status: 400 }
    );
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
    .maybeSingle();

  const partnerId = couple
    ? couple.profile_a_id === user.id
      ? couple.profile_b_id
      : couple.profile_a_id
    : null;

  if (partnerId && couple) {
    const { error: notifErr } = await supabase.from("partner_notifications").insert({
      to_user_id: partnerId,
      from_user_id: user.id,
      type: "partner_left_app",
      payload: {},
    });
    if (notifErr) {
      return NextResponse.json(
        { error: "Failed to notify partner. Please try again." },
        { status: 500 }
      );
    }

    const { error: deleteCoupleErr } = await supabase.from("couples").delete().eq("id", couple.id);
    if (deleteCoupleErr) {
      return NextResponse.json(
        { error: "Failed to unlink. Please try again." },
        { status: 500 }
      );
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Account deletion is not configured. Contact support." },
      { status: 503 }
    );
  }

  try {
    const admin = createAdminClient();
    const { error: deleteUserErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserErr) {
      return NextResponse.json(
        { error: deleteUserErr.message || "Failed to delete account." },
        { status: 500 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to delete account. Contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
