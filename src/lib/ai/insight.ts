import type { LoveScores } from "@/types/assessment";

export interface AnalystOutput {
  topThreeVariances: { dimension: string; variance: number; description: string }[];
  loveDeficit: number;
  summary: string;
}

export interface CoachOutput {
  relationshipPrescription: string;
  threeDates: { title: string; why: string }[];
}

export interface SoloAnalystOutput {
  strengths: { dimension: string; score: number; description: string }[];
  growArea: { dimension: string; description: string };
  summary: string;
}

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export type DeepCutExchange = { prompt: string; answerA: string; answerB: string };

export async function generateCoupleInsight(
  userStats: { giving: LoveScores; receiving: LoveScores },
  partnerStats: { giving: LoveScores; receiving: LoveScores },
  deepCutExchanges: DeepCutExchange[] = [],
  names?: { myName?: string; partnerName?: string }
): Promise<{ analyst: AnalystOutput; coach: CoachOutput }> {
  const analyst = await runAnalyst(userStats, partnerStats);
  const coach = await runCoach(analyst, deepCutExchanges, names);
  return { analyst, coach };
}

export type SoloDeepCut = { prompt: string; answer: string };

export async function generateSoloInsight(
  giving: LoveScores,
  receiving: LoveScores,
  myDeepCuts: SoloDeepCut[] = [],
  myName?: string
): Promise<CoachOutput> {
  const analyst = await runSoloAnalyst(giving, receiving);
  return runSoloCoach(analyst, myDeepCuts, myName);
}

async function runSoloAnalyst(giving: LoveScores, receiving: LoveScores): Promise<SoloAnalystOutput> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return getFallbackSoloAnalyst();

  const payload = {
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `You analyze one person's love language scores (1-10) for self-growth insight.
Dimensions: words, service, gifts, time, touch. Two vectors: giving (how they express love), receiving (how they need to receive love).
Identify their top 2 strengths (dimension + brief description), one area to grow (where giving and receiving might be misaligned or low), and a 1–2 sentence summary. No consumerist advice. Focus on creation, presence, and self-awareness.
Output valid JSON only, no markdown:
{"strengths":[{"dimension":"string","score":number,"description":"string"}],"growArea":{"dimension":"string","description":"string"},"summary":"string"}`,
      },
      {
        role: "user",
        content: JSON.stringify({ giving, receiving }),
      },
    ],
    temperature: 0.3,
  };

  const res = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return getFallbackSoloAnalyst();

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return getFallbackSoloAnalyst();

  try {
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as SoloAnalystOutput;
    if (parsed.strengths?.length && parsed.growArea && parsed.summary) return parsed;
  } catch {
    // ignore
  }
  return getFallbackSoloAnalyst();
}

function getFallbackSoloAnalyst(): SoloAnalystOutput {
  return {
    strengths: [
      { dimension: "words", score: 5, description: "Verbal affirmation." },
      { dimension: "time", score: 5, description: "Quality time." },
    ],
    growArea: { dimension: "touch", description: "Physical closeness." },
    summary: "Your love map is unique. Get personalized insights above.",
  };
}

async function runSoloCoach(analyst: SoloAnalystOutput, myDeepCuts: SoloDeepCut[] = [], myName?: string): Promise<CoachOutput> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return getFallbackSoloCoach();

  const nameBlock = myName ? `\nThe person's first name (use when it feels natural): ${myName.split(/\s+/)[0]}.` : "";
  const deepCutsBlock =
    myDeepCuts.length > 0
      ? `\n\nOptional context — this person's "Deep Cuts" answers (question + their answer). Use to personalize the prescription and rituals:\n${JSON.stringify(myDeepCuts)}`
      : "";

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You help a single person grow in self-awareness and emotional readiness using their love language analysis (strengths, one area to grow, summary).
Your job: Write a short "Personal prescription" (2–3 paragraphs) focused on self-growth: how they can understand themselves better, build healthy habits, and be ready to give and receive love. Then suggest exactly 3 actionable, non-consumerist rituals or practices (title + one sentence "why"). FORBIDDEN: buying gifts, expensive dinners, trips, generic consumerist dates. Focus on creation, presence, and small daily rituals.
Tone: Warm, clear, and productive. Sound human and supportive—not corporate, not overly poetic or flowery. One or two thoughtful phrases are fine; keep the rest grounded and useful.
Output valid JSON only, no markdown:
{"relationshipPrescription":"string","threeDates":[{"title":"string","why":"string"}]}${nameBlock}${deepCutsBlock}`,
      },
      {
        role: "user",
        content: JSON.stringify(analyst),
      },
    ],
    temperature: 0.7,
  };

  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return getFallbackSoloCoach();

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return getFallbackSoloCoach();

  try {
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as CoachOutput;
    if (parsed.relationshipPrescription && Array.isArray(parsed.threeDates)) return parsed;
  } catch {
    // ignore
  }
  return getFallbackSoloCoach();
}

function getFallbackSoloCoach(): CoachOutput {
  return {
    relationshipPrescription:
      "Your love language map is yours alone. Use it to notice how you give and what you need. When you're ready to share it with someone, you'll already know the way.",
    threeDates: [
      { title: "Words night", why: "Lean into verbal affirmation." },
      { title: "Solo quality time", why: "Undistracted presence with yourself." },
      { title: "Touch-friendly ritual", why: "Physical self-care or connection." },
    ],
  };
}

async function runAnalyst(
  userStats: { giving: LoveScores; receiving: LoveScores },
  partnerStats: { giving: LoveScores; receiving: LoveScores }
): Promise<AnalystOutput> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    return getFallbackAnalyst();
  }

  const payload = {
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `Analyze two people's love language scores (1-10): giving (how they express love), receiving (how they need to receive love). Dimensions: words, service, gifts, time, touch.
Identify the 3 biggest variances between them and a 1–2 sentence summary. No consumerist advice. Focus on creation and presence.
Output valid JSON only, no markdown:
{"topThreeVariances":[{"dimension":"string","variance":number,"description":"string"}],"loveDeficit":number,"summary":"string"}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          partnerA: { giving: userStats.giving, receiving: userStats.receiving },
          partnerB: { giving: partnerStats.giving, receiving: partnerStats.receiving },
        }),
      },
    ],
    temperature: 0.3,
  };

  const res = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return getFallbackAnalyst();
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return getFallbackAnalyst();

  try {
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as AnalystOutput;
    if (parsed.topThreeVariances && Array.isArray(parsed.topThreeVariances) && typeof parsed.loveDeficit === "number") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return getFallbackAnalyst();
}

function getFallbackAnalyst(): AnalystOutput {
  return {
    topThreeVariances: [
      { dimension: "words", variance: 0, description: "Compare your scores to find gaps." },
      { dimension: "time", variance: 0, description: "Quality time alignment matters." },
      { dimension: "touch", variance: 0, description: "Physical touch preferences vary." },
    ],
    loveDeficit: 0,
    summary: "Complete your assessments to get personalized analysis.",
  };
}

async function runCoach(
  analyst: AnalystOutput,
  deepCutExchanges: DeepCutExchange[] = [],
  names?: { myName?: string; partnerName?: string }
): Promise<CoachOutput> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return getFallbackCoach();
  }

  const myFirst = names?.myName?.trim().split(/\s+/)[0] || "Partner A";
  const partnerFirst = names?.partnerName?.trim().split(/\s+/)[0] || "Partner B";
  const namesBlock = `\nUse their first names when it fits naturally: ${myFirst} (the person viewing this) and ${partnerFirst} (their partner). Make it personal—reference each by name and their specific scores/patterns where it helps.`;

  const deepCutsBlock =
    deepCutExchanges.length > 0
      ? `\n\nOptional context — the couple's "Deep Cuts" answers (question and both partners' answers). Use to personalize the prescription and rituals; reference their words where relevant:\n${JSON.stringify(deepCutExchanges)}`
      : "";

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You help a couple grow together and love each other better using their combined love language data (variances, summary). You receive analysis of both partners' giving and receiving scores.
Your job: Write a short "Relationship Prescription" (2–3 paragraphs) that is personal and specific: how they can grow together, meet each other's needs, and strengthen the relationship. Use both partners' first names and refer to their actual patterns (e.g. "When ${partnerFirst} gives high on X but ${myFirst} needs more Y..."). Then suggest exactly 3 actionable, non-consumerist rituals or "dates" (title + one sentence "why"). FORBIDDEN: buying gifts, expensive dinners, trips, generic consumerist dates. Focus on creation, presence, and small daily rituals (e.g. handwritten notes, cooking together, a shared playlist, quality time blocks).
Tone: Warm, clear, and productive. Sound human and supportive—not corporate, not overly poetic or flowery. Be specific to their data and use their names so it feels written for them.
Output valid JSON only, no markdown:
{"relationshipPrescription":"string","threeDates":[{"title":"string","why":"string"}]}${namesBlock}${deepCutsBlock}`,
      },
      {
        role: "user",
        content: JSON.stringify(analyst),
      },
    ],
    temperature: 0.7,
  };

  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return getFallbackCoach();
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return getFallbackCoach();

  try {
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")) as CoachOutput;
    if (parsed.relationshipPrescription && Array.isArray(parsed.threeDates)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return getFallbackCoach();
}

function getFallbackCoach(): CoachOutput {
  return {
    relationshipPrescription:
      "Your love maps are being drawn. Once you and your partner have both completed the assessment, we'll give you a tailored prescription and date ideas.",
    threeDates: [
      { title: "Words night", why: "Focus on verbal affirmation." },
      { title: "Quality time outing", why: "Undistracted connection." },
      { title: "Touch-friendly activity", why: "Physical closeness." },
    ],
  };
}
