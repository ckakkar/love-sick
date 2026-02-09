import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MIN_WORDS = 50;

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((s) => s.length > 0).length;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length === 0) {
    return NextResponse.json({ error: "Please write a reason to send to your partner." }, { status: 400 });
  }
  if (wordCount(reason) < MIN_WORDS) {
    return NextResponse.json(
      { error: `Your message must be at least ${MIN_WORDS} words so your partner can understand why you're unlinking.` },
      { status: 400 }
    );
  }

  const { data: couple, error: coupleErr } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
    .maybeSingle();

  if (coupleErr || !couple) {
    return NextResponse.json({ error: "You are not linked with a partner." }, { status: 404 });
  }

  const partnerId = couple.profile_a_id === user.id ? couple.profile_b_id : couple.profile_a_id;
  if (!partnerId) {
    return NextResponse.json({ error: "No partner found on this link." }, { status: 400 });
  }

  const { error: notifErr } = await supabase.from("partner_notifications").insert({
    to_user_id: partnerId,
    from_user_id: user.id,
    type: "unlink_reason",
    payload: { reason },
  });

  if (notifErr) {
    return NextResponse.json({ error: notifErr.message || "Failed to send message to partner." }, { status: 500 });
  }

  const { error: deleteErr } = await supabase.from("couples").delete().eq("id", couple.id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message || "Failed to unlink." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
