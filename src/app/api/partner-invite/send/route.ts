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
  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  const { data: toUserId } = await supabase.rpc("get_user_id_by_username", { uname: username });
  if (!toUserId) {
    return NextResponse.json({ error: "No user found with that username." }, { status: 404 });
  }

  if (toUserId === user.id) {
    return NextResponse.json({ error: "You cannot send an invite to yourself." }, { status: 400 });
  }

  const { data: existingCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
    .maybeSingle();
  if (existingCouple) {
    return NextResponse.json({ error: "You are already linked with a partner." }, { status: 409 });
  }

  const { data: existingRequest } = await supabase
    .from("partner_requests")
    .select("id, status")
    .eq("from_user_id", user.id)
    .eq("to_user_id", toUserId)
    .maybeSingle();

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      return NextResponse.json({ error: "You already sent an invite to this user." }, { status: 409 });
    }
    if (existingRequest.status === "accepted") {
      return NextResponse.json({ error: "You are already linked with this user." }, { status: 409 });
    }
  }

  const { data: theirCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`profile_a_id.eq.${toUserId},profile_b_id.eq.${toUserId}`)
    .maybeSingle();
  if (theirCouple) {
    return NextResponse.json({ error: "That user is already linked with a partner." }, { status: 409 });
  }

  const { data: inserted, error } = await supabase
    .from("partner_requests")
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      status: "pending",
    })
    .select("id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Invite already sent." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(inserted);
}
