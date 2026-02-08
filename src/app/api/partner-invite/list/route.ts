import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows } = await supabase.rpc("get_partner_requests_with_usernames", { uid: user.id });
  const list = (rows ?? []) as {
    direction: string;
    request_id: string;
    other_user_id: string;
    other_username: string | null;
    other_name: string | null;
    status: string;
    created_at: string;
  }[];

  const sent = list
    .filter((r) => r.direction === "sent")
    .map((r) => ({
      id: r.request_id,
      to_user_id: r.other_user_id,
      status: r.status,
      created_at: r.created_at,
      to_username: r.other_username,
      to_name: r.other_name,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const received = list
    .filter((r) => r.direction === "received")
    .map((r) => ({
      id: r.request_id,
      from_user_id: r.other_user_id,
      status: r.status,
      created_at: r.created_at,
      from_username: r.other_username,
      from_name: r.other_name,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ sent, received });
}
