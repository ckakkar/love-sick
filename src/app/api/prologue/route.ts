import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MIN_LENGTH = 150;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const content = (body?.content as string)?.trim();
  const partnerId = body?.partner_id as string | undefined;

  if (!content || content.length < MIN_LENGTH || !partnerId) {
    return NextResponse.json(
      { error: "Content must be at least 150 characters and partner_id is required." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("prologues").upsert(
    {
      user_id: user.id,
      partner_id: partnerId,
      content,
    },
    { onConflict: "user_id,partner_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
