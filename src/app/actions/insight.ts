"use server";

import { generateCoupleInsight } from "@/lib/ai/insight";
import type { LoveScores } from "@/types/assessment";

export async function getCoupleInsight(
  userGiving: LoveScores,
  userReceiving: LoveScores,
  partnerGiving: LoveScores,
  partnerReceiving: LoveScores
) {
  return generateCoupleInsight(
    { giving: userGiving, receiving: userReceiving },
    { giving: partnerGiving, receiving: partnerReceiving }
  );
}
