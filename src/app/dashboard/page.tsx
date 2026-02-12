import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { normalizeLoveScores, type LoveScores } from "@/types/assessment";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, display_name, age, sex, notify_partner_online, timezone")
    .eq("id", user.id)
    .single();

  if (!profile?.username) {
    redirect("/onboarding");
  }

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, giving_scores, receiving_scores, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const myAssessment = assessments?.[0] ?? null;
  const myGiving = myAssessment ? normalizeLoveScores(myAssessment.giving_scores) : null;
  const myReceiving = myAssessment ? normalizeLoveScores(myAssessment.receiving_scores) : null;

  const { data: couples } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id, status, invite_code, updated_at")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`);

  const partnerId =
    couples?.[0]?.profile_a_id === user.id
      ? couples[0].profile_b_id
      : couples?.[0]?.profile_a_id ?? null;

  let partnerAssessment: { giving_scores: LoveScores; receiving_scores: LoveScores } | null = null;
  if (partnerId) {
    const { data: partnerAssess } = await supabase
      .from("assessments")
      .select("giving_scores, receiving_scores")
      .eq("user_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    partnerAssessment = partnerAssess
      ? {
          giving_scores: normalizeLoveScores(partnerAssess.giving_scores),
          receiving_scores: normalizeLoveScores(partnerAssess.receiving_scores),
        }
      : null;
  }

  const coupleId = couples?.[0]?.id ?? null;
  const linkedAt = couples?.[0]?.updated_at ?? null;
  const daysLinked =
    linkedAt != null
      ? Math.max(0, Math.floor((Date.now() - new Date(linkedAt).getTime()) / (24 * 60 * 60 * 1000)))
      : null;

  let partnerRequests: { sent: { id: string; to_username: string | null; to_name: string | null; created_at: string }[]; received: { id: string; from_username: string | null; from_name: string | null; created_at: string }[] } = { sent: [], received: [] };
  try {
    const { data: list } = await supabase.rpc("get_partner_requests_with_usernames", { uid: user.id });
    const rows = (list ?? []) as { direction: string; request_id: string; other_username: string | null; other_name: string | null; created_at: string }[];
    partnerRequests = {
      sent: rows.filter((r) => r.direction === "sent").map((r) => ({ id: r.request_id, to_username: r.other_username, to_name: r.other_name, created_at: r.created_at })),
      received: rows.filter((r) => r.direction === "received").map((r) => ({ id: r.request_id, from_username: r.other_username, from_name: r.other_name, created_at: r.created_at })),
    };
  } catch {
    // ignore
  }

  let hasPrologue = false;
  let myPrologueContent: string | null = null;
  let partnerPrologueContent: string | null = null;
  if (partnerId) {
    const { data: myPrologue } = await supabase
      .from("prologues")
      .select("content")
      .eq("user_id", user.id)
      .eq("partner_id", partnerId)
      .maybeSingle();
    hasPrologue = !!myPrologue;
    myPrologueContent = myPrologue?.content ?? null;

    const { data: partnerPrologue } = await supabase
      .from("prologues")
      .select("content")
      .eq("user_id", partnerId)
      .eq("partner_id", user.id)
      .maybeSingle();
    partnerPrologueContent = partnerPrologue?.content ?? null;
  }

  const displayName = profile?.full_name || profile?.display_name || profile?.username || null;

  let partnerTimezone: string | null = null;
  let partnerDisplayName: string | null = null;
  if (partnerId) {
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("timezone, full_name, display_name, username")
      .eq("id", partnerId)
      .single();
    partnerTimezone = partnerProfile?.timezone ?? null;
    partnerDisplayName =
      partnerProfile?.full_name || partnerProfile?.display_name || partnerProfile?.username || null;
  }

  return (
    <DashboardClient
      myGiving={myGiving}
      myReceiving={myReceiving}
      partnerGiving={partnerAssessment?.giving_scores ?? null}
      partnerReceiving={partnerAssessment?.receiving_scores ?? null}
      hasPartner={!!partnerId}
      partnerId={partnerId ?? null}
      coupleId={coupleId}
      daysLinked={daysLinked}
      hasPrologue={hasPrologue}
      myPrologueContent={myPrologueContent}
      partnerPrologueContent={partnerPrologueContent}
      partnerRequests={partnerRequests}
      myUsername={profile?.username ?? null}
      displayName={displayName}
      hasAssessment={!!myAssessment}
      notifyPartnerOnline={profile?.notify_partner_online !== false}
      myTimezone={profile?.timezone ?? null}
      partnerTimezone={partnerTimezone}
      partnerDisplayName={partnerDisplayName}
    />
  );
}
