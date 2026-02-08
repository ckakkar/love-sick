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

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export async function generateCoupleInsight(
  userStats: { giving: LoveScores; receiving: LoveScores },
  partnerStats: { giving: LoveScores; receiving: LoveScores }
): Promise<{ analyst: AnalystOutput; coach: CoachOutput }> {
  const analyst = await runAnalyst(userStats, partnerStats);
  const coach = await runCoach(analyst);
  return { analyst, coach };
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
        content: `You are a 'Romantic Essentialist' and 'Data Poet.' Analyze two JSON datasets representing love language scores (1-10) for two partners.
Partner A: giving (how they express love), receiving (how they need to receive love). Same for Partner B.
Dimensions: words, service, gifts, time, touch.
Identify the 3 biggest statistical variances between the two people. You are STRICTLY FORBIDDEN from suggesting: buying gifts, expensive dinners, booking trips, or standard consumerist dates. Focus on 'Creation' over 'Consumption.'
Output valid JSON only, no markdown, with this exact shape:
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

async function runCoach(analyst: AnalystOutput): Promise<CoachOutput> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return getFallbackCoach();
  }

  const payload = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a 'Romantic Essentialist' and 'Data Poet.'
Your Goal: Analyze the relationship data to suggest growth, but you are STRICTLY FORBIDDEN from suggesting: buying gifts, expensive dinners, booking trips, or standard consumerist dates.

Your Rules:
1. Focus on 'Creation' over 'Consumption'.
2. If they need 'Quality Time', suggest: 'Baking oat brownies together on video call' or 'Building a blanket fort.'
3. If they need 'Gifts', suggest: 'Hand-writing a letter' or 'Folding an origami frog.'
4. If they need 'Acts of Service', suggest: 'Creating a custom playlist' or 'Debugging their code.'

Tone: Witty, deep, and slightly poetic. No corporate speak.

You receive analysis data (top variances and love deficit). Write a short "Relationship Prescription": 2-3 paragraphs. Then suggest exactly 3 actionable, non-consumerist "dates" or rituals (title + one sentence "why" for each). Output valid JSON only, no markdown:
{"relationshipPrescription":"string","threeDates":[{"title":"string","why":"string"}]}`,
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
