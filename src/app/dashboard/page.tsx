import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import type { LoveScores } from "@/types/assessment";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?signin=1");

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, giving_scores, receiving_scores, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const myAssessment = assessments?.[0] ?? null;
  const myGiving = (myAssessment?.giving_scores ?? null) as LoveScores | null;
  const myReceiving = (myAssessment?.receiving_scores ?? null) as LoveScores | null;

  const { data: couples } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id, status, invite_code")
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`);

  const partnerId =
    couples?.[0]?.profile_a_id === user.id
      ? couples[0].profile_b_id
      : couples?.[0]?.profile_b_id ?? null;

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
          giving_scores: partnerAssess.giving_scores as LoveScores,
          receiving_scores: partnerAssess.receiving_scores as LoveScores,
        }
      : null;
  }

  const inviteCode = couples?.[0]?.invite_code ?? null;
  const isInviter = couples?.[0]?.profile_a_id === user.id;
  const coupleId = couples?.[0]?.id ?? null;

  let hasPrologue = false;
  if (partnerId) {
    const { data: prologue } = await supabase
      .from("prologues")
      .select("id")
      .eq("user_id", user.id)
      .eq("partner_id", partnerId)
      .maybeSingle();
    hasPrologue = !!prologue;
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
      hasPrologue={hasPrologue}
      inviteCode={inviteCode}
      isInviter={isInviter}
    />
  );
}
