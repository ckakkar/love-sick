"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import type { LoveScores } from "@/types/assessment";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function DigitalGarden({
  scores,
  partnerId,
  onLeafSent,
}: {
  scores: LoveScores;
  partnerId: string | null;
  onLeafSent: () => void;
}) {
  const touch = clamp(scores.touch ?? 5, 1, 10);
  const time = clamp(scores.time ?? 5, 1, 10);
  const words = clamp(scores.words ?? 5, 1, 10);
  const service = clamp(scores.service ?? 5, 1, 10);
  const gifts = clamp(scores.gifts ?? 5, 1, 10);

  const rootDepth = 8 + (touch / 10) * 12;
  const stemHeight = 80 + (time / 10) * 120;
  const leafCount = 3 + Math.round((words / 10) * 7);
  const flowerYellow = service / 10;
  const flowerPurple = gifts / 10;
  const flowerColor = `rgb(${Math.round(255 - flowerPurple * 180)}, ${Math.round(180 + flowerYellow * 75)}, ${Math.round(100 + flowerPurple * 155)})`;

  const leafPositions = useMemo(() => {
    const out: { x: number; y: number; angle: number; side: number }[] = [];
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 1) / (leafCount + 1);
      const y = 140 - (t * stemHeight);
      const side = i % 2 === 0 ? 1 : -1;
      const angle = side * (15 + (i % 3) * 12);
      out.push({
        x: 50 + side * (18 + (i % 2) * 8),
        y,
        angle,
        side,
      });
    }
    return out;
  }, [leafCount, stemHeight]);

  const sendLeaf = useCallback(async () => {
    if (!partnerId) return;
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "digital_leaf", partner_id: partnerId }),
    });
    if (res.ok) onLeafSent();
  }, [partnerId, onLeafSent]);

  return (
    <div className="relative h-[320px] w-full">
      <svg
        viewBox="0 0 100 220"
        className="h-full w-full"
        style={{ overflow: "visible" }}
      >
        {/* Roots — depth by Touch */}
        <g fill="none" stroke="var(--chart-1)" strokeWidth="1.2" opacity={0.6}>
          {[0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d={`M ${50 - i * 6} 180 Q ${40 - i * 4} ${180 + rootDepth} ${50} ${180 + rootDepth + 5} Q ${60 + i * 4} ${180 + rootDepth} ${50 + i * 6} 180`}
              initial={{ pathLength: 0, opacity: 0.6 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            />
          ))}
          {[0, 1].map((i) => (
            <motion.path
              key={`r-${i}`}
              d={`M 50 180 v ${rootDepth + 2}`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          ))}
        </g>

        {/* Stem — height by Time */}
        <motion.path
          d={`M 50 180 L 50 ${180 - stemHeight}`}
          fill="none"
          stroke="var(--chart-5)"
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Leaves — count by Words; click to send */}
        {leafPositions.map((leaf, i) => (
          <g
            key={i}
            transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.angle})`}
            style={{ cursor: partnerId ? "pointer" : "default" }}
            onClick={partnerId ? sendLeaf : undefined}
          >
            <motion.ellipse
              rx="6"
              ry="3"
              fill="var(--chart-5)"
              opacity={0.9}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.4 + i * 0.05 }}
            />
          </g>
        ))}

        {/* Flower — color by Service (yellow) / Gifts (purple) */}
        <motion.g
          transform={`translate(50, ${180 - stemHeight})`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 150, delay: 0.6 }}
        >
          <circle r="5" fill={flowerColor} opacity={0.95} />
          <circle r="3" fill="var(--chart-2)" />
        </motion.g>
      </svg>
      {partnerId && (
        <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-muted-foreground">
          Pick a leaf to send it to your partner
        </p>
      )}
    </div>
  );
}
