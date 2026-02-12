export const LOVE_LANGUAGE_KEYS = ["words", "service", "gifts", "time", "touch"] as const;
export type LoveLanguageKey = (typeof LOVE_LANGUAGE_KEYS)[number];

export type LoveScores = Record<LoveLanguageKey, number>;

export const DEFAULT_SCORES: LoveScores = {
  words: 5,
  service: 5,
  gifts: 5,
  time: 5,
  touch: 5,
};

export const LOVE_LANGUAGE_LABELS: Record<LoveLanguageKey, string> = {
  words: "Words of Affirmation",
  service: "Acts of Service",
  gifts: "Receiving Gifts",
  time: "Quality Time",
  touch: "Physical Touch",
};

const SCORE_MIN = 1;
const SCORE_MAX = 10;
const SCORE_DEFAULT = 5;

function clampScore(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : SCORE_DEFAULT;
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(n)));
}

/** Normalize raw DB/JSON scores to LoveScores (1–10 per key). Handles object, array-by-index, or missing keys. */
export function normalizeLoveScores(raw: unknown): LoveScores {
  const out = { ...DEFAULT_SCORES };
  if (Array.isArray(raw) && raw.length >= 5) {
    LOVE_LANGUAGE_KEYS.forEach((key, i) => {
      out[key] = clampScore(raw[i]);
    });
    return out;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    LOVE_LANGUAGE_KEYS.forEach((key) => {
      const v = obj[key] ?? obj[key.toLowerCase()];
      out[key] = clampScore(v);
    });
    return out;
  }
  return out;
}

export interface AssessmentRow {
  id: string;
  user_id: string;
  giving_scores: LoveScores;
  receiving_scores: LoveScores;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface CoupleRow {
  id: string;
  profile_a_id: string;
  profile_b_id: string | null;
  status: "pending" | "active";
  anniversary_date: string | null;
  invite_code: string | null;
}
