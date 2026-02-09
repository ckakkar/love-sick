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

  const { data: couples } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`);

  const couple = couples?.[0] ?? null;
  const partnerId = couple
    ? couple.profile_a_id === user.id
      ? couple.profile_b_id
      : couple.profile_a_id
    : null;

  return NextResponse.json({
    hasPartner: !!partnerId,
    partnerId: partnerId ?? null,
    coupleId: couple?.id ?? null,
  });
}
