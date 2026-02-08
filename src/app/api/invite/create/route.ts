import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only 2 users can connect at a time: you can only be in one couple (as A or B).
  const { data: existingAsA } = await supabase
    .from("couples")
    .select("id, invite_code, profile_b_id")
    .eq("profile_a_id", user.id)
    .maybeSingle();

  const { data: existingAsB } = await supabase
    .from("couples")
    .select("id, invite_code")
    .eq("profile_b_id", user.id)
    .maybeSingle();

  if (existingAsB) {
    return NextResponse.json(
      { error: "already_linked", message: "You're already linked with a partner. Only two people can connect at a time." },
      { status: 409 }
    );
  }

  if (existingAsA) {
    return NextResponse.json({ code: existingAsA.invite_code });
  }

  const code = randomBytes(8).toString("hex");

  const { data: couple, error } = await supabase
    .from("couples")
    .insert({
      profile_a_id: user.id,
      profile_b_id: null,
      status: "pending",
      invite_code: code,
      invited_by_id: user.id,
    })
    .select("invite_code")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code: couple.invite_code });
}
