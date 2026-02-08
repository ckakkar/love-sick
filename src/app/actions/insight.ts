"use server";

import { generateCoupleInsight, generateSoloInsight } from "@/lib/ai/insight";
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

export async function getSoloInsight(giving: LoveScores, receiving: LoveScores) {
  return generateSoloInsight(giving, receiving);
}
