import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = body?.code as string | undefined;
  if (!code) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Only 2 users at a time: acceptor must not already be in any couple.
  const { data: alreadyInCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
    .maybeSingle();

  if (alreadyInCouple) {
    return NextResponse.json(
      { ok: false, error: "already_linked", message: "You're already linked with a partner. Only two people can connect at a time." },
      { status: 409 }
    );
  }

  const { data: couple, error: fetchError } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id, status")
    .eq("invite_code", code)
    .single();

  if (fetchError || !couple || couple.profile_b_id || couple.status === "active") {
    return NextResponse.json({ ok: false });
  }

  if (couple.profile_a_id === user.id) {
    return NextResponse.json({ ok: true });
  }

  const { error: updateError } = await supabase
    .from("couples")
    .update({
      profile_b_id: user.id,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", couple.id);

  if (updateError) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
