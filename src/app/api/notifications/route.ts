import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type PartnerNotificationRow = {
  id: string;
  to_user_id: string;
  from_user_id: string | null;
  type: "unlink_reason" | "partner_left_app";
  payload: { reason?: string };
  read_at: string | null;
  created_at: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("partner_notifications")
    .select("id, to_user_id, from_user_id, type, payload, read_at, created_at")
    .eq("to_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: rows ?? [] });
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
  const id = body.id ?? body.notification_id;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("partner_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("to_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
