"use client";

import { useMemo } from "react";
import type { LoveScores } from "@/types/assessment";

/* Seeded RNG for deterministic procedural generation */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export interface RootPath {
  d: string;
}

export interface StemSegment {
  d: string;
  delay: number;
}

export interface LeafDef {
  id: string;
  x: number;
  y: number;
  angle: number;
  size: number;
  d: string; // SVG path for leaf shape
}

export interface FlowerDef {
  cx: number;
  cy: number;
  petalCount: number;
  petalLength: number;
  petalWidth: number;
  innerRadius: number;
  serviceVibrancy: number; // 0-1 for color lerp
  giftsComplexity: number; // 0-1 for second layer
}

export interface FireflyDef {
  id: string;
  x: number;
  y: number;
  radius: number;
  delay: number;
  duration: number;
}

export interface PlantData {
  roots: RootPath[];
  stemSegments: StemSegment[];
  leaves: LeafDef[];
  flower: FlowerDef;
  fireflies: FireflyDef[];
  stemHeight: number;
  baseY: number;
}

function hashScores(scores: LoveScores): number {
  const s = `${scores.words}-${scores.service}-${scores.gifts}-${scores.time}-${scores.touch}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function usePlantGenerator(scores: LoveScores): PlantData {
  return useMemo(() => {
    const touch = clamp(scores.touch ?? 5, 1, 10);
    const time = clamp(scores.time ?? 5, 1, 10);
    const words = clamp(scores.words ?? 5, 1, 10);
    const service = clamp(scores.service ?? 5, 1, 10);
    const gifts = clamp(scores.gifts ?? 5, 1, 10);

    const seed = hashScores(scores);
    const rng = mulberry32(seed);

    const baseY = 200;
    const rootDepth = 12 + (touch / 10) * 28;
    const stemHeight = 70 + (time / 10) * 130;
    const leafCount = 3 + Math.round((words / 10) * 8);
    const leafSizeBase = 2.5 + (words / 10) * 3;

    // —— Roots (Touch): entangled, curved tendrils ——
    const rootCount = 3 + Math.round((touch / 10) * 5);
    const roots: RootPath[] = [];
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 0.9 - Math.PI * 0.45 + (rng() - 0.5) * 0.4;
      const len = rootDepth * (0.6 + rng() * 0.5);
      const cx = 50 + Math.cos(angle) * len * 0.4 + (rng() - 0.5) * 8;
      const cy = baseY + len * 0.5 + (rng() - 0.5) * 5;
      const endX = 50 + Math.sin(angle) * len * 0.8 + (rng() - 0.5) * 12;
      const endY = baseY + len;
      const d = `M 50 ${baseY} Q ${cx} ${cy} ${endX} ${endY}`;
      roots.push({ d });
    }
    // Extra fine roots for high touch
    if (touch >= 7) {
      for (let i = 0; i < 3; i++) {
        const angle = rng() * Math.PI * 0.6 - Math.PI * 0.3;
        const len = rootDepth * (0.3 + rng() * 0.3);
        const cx = 50 + (rng() - 0.5) * 20;
        const cy = baseY + len * 0.6;
        const endX = 50 + Math.sin(angle) * len + (rng() - 0.5) * 10;
        const endY = baseY + len;
        roots.push({ d: `M 50 ${baseY} Q ${cx} ${cy} ${endX} ${endY}` });
      }
    }

    // —— Stem: main + recursive branches (Time) ——
    const stemSegments: StemSegment[] = [];
    const branchPoints: { x: number; y: number; angle: number; level: number }[] = [];

    const mainTopY = baseY - stemHeight;
    stemSegments.push({
      d: `M 50 ${baseY} L 50 ${mainTopY}`,
      delay: 0.15,
    });

    const branchCount = 2 + Math.round((time / 10) * 3);
    for (let i = 0; i < branchCount; i++) {
      const t = 0.25 + (i / (branchCount + 1)) * 0.6;
      const bx = 50 + (rng() - 0.5) * 4;
      const by = baseY - stemHeight * t;
      const angle = (rng() - 0.5) * Math.PI * 0.7;
      const branchLen = stemHeight * 0.25 * (0.5 + rng() * 0.5) * (1 + time / 20);
      const ex = bx + Math.sin(angle) * branchLen;
      const ey = by - Math.cos(angle) * branchLen;
      stemSegments.push({
        d: `M ${bx} ${by} L ${ex} ${ey}`,
        delay: 0.25 + i * 0.06,
      });
      branchPoints.push({ x: ex, y: ey, angle, level: 1 });
      // Sub-branches for high time
      if (time >= 6 && i % 2 === 0) {
        const subAngle = angle + (rng() - 0.5) * 0.8;
        const subLen = branchLen * 0.5;
        const sx = ex + Math.sin(subAngle) * subLen;
        const sy = ey - Math.cos(subAngle) * subLen;
        stemSegments.push({
          d: `M ${ex} ${ey} L ${sx} ${sy}`,
          delay: 0.4 + i * 0.05,
        });
        branchPoints.push({ x: sx, y: sy, angle: subAngle, level: 2 });
      }
    }
    branchPoints.push({ x: 50, y: mainTopY, angle: 0, level: 0 });

    // —— Leaves (Words): attach to stem tip and branch tips ——
    const leaves: LeafDef[] = [];
    const leafShapes = [
      (s: number) => `M 0 0 Q ${s * 0.8} ${-s * 0.3} ${s} 0 Q ${s * 0.7} ${s * 0.25} 0 0`,
      (s: number) => `M 0 0 Q ${s * 0.6} ${-s * 0.5} ${s * 0.9} 0 Q ${s * 0.5} ${s * 0.4} 0 0`,
      (s: number) => `M 0 0 L ${s} 0 Q ${s * 0.6} ${s * 0.2} ${s * 0.3} 0 Q ${s * 0.2} ${-s * 0.15} 0 0`,
    ];
    for (let i = 0; i < leafCount; i++) {
      const pt = branchPoints[i % branchPoints.length];
      const side = i % 2 === 0 ? 1 : -1;
      const angle = pt.angle + side * (0.4 + rng() * 0.5);
      const size = leafSizeBase * (0.8 + rng() * 0.4);
      const shapeIndex = Math.floor(rng() * leafShapes.length);
      const dx = (rng() - 0.5) * 3;
      const dy = (rng() - 0.5) * 2;
      leaves.push({
        id: `leaf-${i}-${rng().toString(36).slice(2, 6)}`,
        x: pt.x + dx,
        y: pt.y + dy,
        angle,
        size,
        d: leafShapes[shapeIndex](size),
      });
    }

    // —— Flower (Service = color, Gifts = complexity) ——
    const petalCount = 5 + Math.round((gifts / 10) * 7);
    const petalLength = 4 + (gifts / 10) * 4;
    const petalWidth = 2 + (gifts / 10) * 2;
    const flower: FlowerDef = {
      cx: 50,
      cy: mainTopY,
      petalCount,
      petalLength,
      petalWidth,
      innerRadius: 2.5,
      serviceVibrancy: service / 10,
      giftsComplexity: gifts / 10,
    };

    // —— Fireflies ——
    const fireflyCount = 5 + Math.floor(rng() * 4);
    const fireflies: FireflyDef[] = [];
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        id: `ff-${i}-${rng().toString(36).slice(2, 6)}`,
        x: 10 + rng() * 80,
        y: 30 + rng() * 160,
        radius: 0.4 + rng() * 0.5,
        delay: rng() * 4,
        duration: 3 + rng() * 4,
      });
    }

    return {
      roots,
      stemSegments,
      leaves,
      flower,
      fireflies,
      stemHeight,
      baseY,
    };
  }, [
    scores.words,
    scores.service,
    scores.gifts,
    scores.time,
    scores.touch,
  ]);
}
