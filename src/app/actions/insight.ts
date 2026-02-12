"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCoupleInsight, generateSoloInsight } from "@/lib/ai/insight";
import type { LoveScores } from "@/types/assessment";

export type DeepCutExchange = { prompt: string; answerA: string; answerB: string };

async function getRevealedDeepCuts(coupleId: string): Promise<DeepCutExchange[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: answers } = await supabase
    .from("deep_cut_answers")
    .select("question_id, user_id, content")
    .eq("couple_id", coupleId);

  if (!answers?.length) return [];

  const { data: couple } = await supabase
    .from("couples")
    .select("profile_a_id, profile_b_id")
    .eq("id", coupleId)
    .single();
  if (!couple) return [];

  const byQuestion = new Map<string, { a: string; b: string }>();
  for (const ans of answers) {
    const key = ans.question_id;
    if (!byQuestion.has(key)) byQuestion.set(key, { a: "", b: "" });
    const cur = byQuestion.get(key)!;
    if (ans.user_id === couple.profile_a_id) cur.a = ans.content;
    else if (ans.user_id === couple.profile_b_id) cur.b = ans.content;
  }

  const questionIds = [...byQuestion.keys()];
  const { data: questions } = await supabase
    .from("deep_cut_questions")
    .select("id, prompt")
    .in("id", questionIds);

  const out: DeepCutExchange[] = [];
  for (const q of questions ?? []) {
    const cur = byQuestion.get(q.id);
    if (cur && cur.a && cur.b) out.push({ prompt: q.prompt, answerA: cur.a, answerB: cur.b });
  }
  return out;
}

export async function getCoupleInsight(
  userGiving: LoveScores,
  userReceiving: LoveScores,
  partnerGiving: LoveScores,
  partnerReceiving: LoveScores,
  coupleId?: string | null,
  myName?: string,
  partnerName?: string
) {
  const deepCuts = coupleId ? await getRevealedDeepCuts(coupleId) : [];
  const result = await generateCoupleInsight(
    { giving: userGiving, receiving: userReceiving },
    { giving: partnerGiving, receiving: partnerReceiving },
    deepCuts,
    { myName, partnerName }
  );
  return result.coach;
}

export type SoloDeepCut = { prompt: string; answer: string };

async function getMyDeepCuts(coupleId: string): Promise<SoloDeepCut[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: answers } = await supabase
    .from("deep_cut_answers")
    .select("question_id, content")
    .eq("couple_id", coupleId)
    .eq("user_id", user.id);

  if (!answers?.length) return [];

  const questionIds = answers.map((a) => a.question_id);
  const { data: questions } = await supabase
    .from("deep_cut_questions")
    .select("id, prompt")
    .in("id", questionIds);

  const promptById = new Map((questions ?? []).map((q) => [q.id, q.prompt]));
  return answers
    .map((a) => ({ prompt: promptById.get(a.question_id), answer: a.content }))
    .filter((x): x is SoloDeepCut => !!x.prompt);
}

export async function getSoloInsight(
  giving: LoveScores,
  receiving: LoveScores,
  coupleId?: string | null,
  myName?: string
) {
  const myDeepCuts = coupleId ? await getMyDeepCuts(coupleId) : [];
  return generateSoloInsight(giving, receiving, myDeepCuts, myName);
}
