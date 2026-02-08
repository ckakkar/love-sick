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
