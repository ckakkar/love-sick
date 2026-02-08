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

  const { error } = await supabase
    .from("partner_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("to_user_id", user.id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
