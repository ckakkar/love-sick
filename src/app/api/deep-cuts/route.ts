import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type DeepCutQuestionItem = {
  id: string;
  prompt: string;
  stage_label: string;
  order_index: number;
  myAnswer: string | null;
  partnerAnswer: string | null;
  revealed: boolean;
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const coupleId = searchParams.get("couple_id");
  if (!coupleId) {
    return NextResponse.json({ error: "couple_id required" }, { status: 400 });
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id, profile_a_id, profile_b_id")
    .eq("id", coupleId)
    .single();

  if (!couple || (couple.profile_a_id !== user.id && couple.profile_b_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partnerId = couple.profile_a_id === user.id ? couple.profile_b_id : couple.profile_a_id;

  const { data: questions } = await supabase
    .from("deep_cut_questions")
    .select("id, prompt, stage_label, order_index")
    .order("order_index", { ascending: true });

  if (!questions?.length) {
    return NextResponse.json({ questions: [] });
  }

  const { data: answers } = await supabase
    .from("deep_cut_answers")
    .select("question_id, user_id, content")
    .eq("couple_id", coupleId);

  const byQuestion = new Map<string, { my: string | null; partner: string | null }>();
  for (const q of questions) {
    byQuestion.set(q.id, { my: null, partner: null });
  }
  for (const a of answers ?? []) {
    const cur = byQuestion.get(a.question_id);
    if (!cur) continue;
    if (a.user_id === user.id) cur.my = a.content;
    else if (a.user_id === partnerId) cur.partner = a.content;
  }

  const items: DeepCutQuestionItem[] = questions.map((q) => {
    const { my, partner } = byQuestion.get(q.id) ?? { my: null, partner: null };
    const revealed = my != null && partner != null;
    return {
      id: q.id,
      prompt: q.prompt,
      stage_label: q.stage_label,
      order_index: q.order_index,
      myAnswer: my,
      partnerAnswer: revealed ? partner : null,
      revealed,
    };
  });

  return NextResponse.json({ questions: items });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const questionId = body.question_id ?? body.questionId;
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const coupleId = body.couple_id ?? body.coupleId;

  if (!questionId || !coupleId) {
    return NextResponse.json({ error: "question_id and couple_id required" }, { status: 400 });
  }
  if (content.length < 1) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .eq("id", coupleId)
    .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
    .single();

  if (!couple) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("deep_cut_answers").upsert(
    {
      question_id: questionId,
      user_id: user.id,
      couple_id: coupleId,
      content,
    },
    { onConflict: "question_id,user_id,couple_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
