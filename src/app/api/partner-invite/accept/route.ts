import { createClient } from "@/lib/supabase/server";
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
  const requestId = body.request_id ?? body.id;
  if (!requestId) {
    return NextResponse.json({ error: "request_id is required." }, { status: 400 });
  }

  const { data: req, error: fetchErr } = await supabase
    .from("partner_requests")
    .select("id, from_user_id, to_user_id, status")
    .eq("id", requestId)
    .eq("to_user_id", user.id)
    .eq("status", "pending")
    .single();

  if (fetchErr || !req) {
    return NextResponse.json({ error: "Invite not found or already handled." }, { status: 404 });
  }

  const { data: existingCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
    .maybeSingle();
  if (existingCouple) {
    return NextResponse.json({ error: "You are already linked with a partner." }, { status: 409 });
  }

  const { error: updateErr } = await supabase
    .from("partner_requests")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const { error: insertErr } = await supabase.from("couples").insert({
    profile_a_id: req.from_user_id,
    profile_b_id: user.id,
    status: "active",
    invited_by_id: req.from_user_id,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
