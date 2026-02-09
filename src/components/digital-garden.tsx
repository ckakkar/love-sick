"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LoveScores } from "@/types/assessment";
import { usePlantGenerator } from "@/hooks/use-plant-generator";

function flowerColor(serviceVibrancy: number): string {
  const r = Math.round(254 - serviceVibrancy * 80);
  const g = Math.round(243 - serviceVibrancy * 50);
  const b = Math.round(199 - serviceVibrancy * 150);
  return `rgb(${r},${g},${b})`;
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
  const plant = usePlantGenerator(scores);
  const [pluckedId, setPluckedId] = useState<string | null>(null);
  const [rippleLeafId, setRippleLeafId] = useState<string | null>(null);

  const sendLeaf = useCallback(
    async (leafId: string) => {
      if (!partnerId) return;
      setRippleLeafId(leafId);
      setTimeout(() => setRippleLeafId(null), 400);
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "digital_leaf", partner_id: partnerId }),
      });
      if (res.ok) {
        setPluckedId(leafId);
        onLeafSent();
      }
    },
    [partnerId, onLeafSent]
  );

  const { roots, stemSegments, leaves, flower, fireflies, baseY } = plant;
  const vbH = baseY + 25;
  const viewBox = `0 0 100 ${vbH}`;

  return (
    <div className="relative min-h-[260px] w-full sm:min-h-[320px] sm:h-[320px] overflow-hidden rounded-lg">
      {/* Fireflies — ethereal background layer */}
      <svg
        viewBox={viewBox}
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id="firefly-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="leaf-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.85} />
          </linearGradient>
          <linearGradient id="leaf-fill-dim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.5} />
          </linearGradient>
        </defs>
        <g style={{ mixBlendMode: "screen" }}>
          {fireflies.map((ff) => (
            <motion.g
              key={ff.id}
              initial={{ opacity: 0.3, x: ff.x, y: ff.y }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                y: [ff.y, ff.y - 18, ff.y],
                x: [ff.x, ff.x + 4, ff.x],
              }}
              transition={{
                duration: ff.duration,
                delay: ff.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <circle
                r={ff.radius}
                fill="#fcd34d"
                filter="url(#firefly-glow)"
                cx={0}
                cy={0}
              />
            </motion.g>
          ))}
        </g>
      </svg>

      {/* Plant layer: sway + grow */}
      <svg
        viewBox={viewBox}
        className="relative h-full w-full"
        style={{ overflow: "visible" }}
      >
        <motion.g
          style={{ transformOrigin: `50px ${baseY}px` }}
          animate={{
            rotate: [0, -1.2, 1.2, 0],
            scale: 1,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Roots — Touch: deep, entangled */}
          <g fill="none" stroke="var(--chart-1)" strokeWidth="1.4" opacity={0.7}>
            {roots.map((root, i) => (
              <motion.path
                key={i}
                d={root.d}
                initial={{ pathLength: 0, opacity: 0.7 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </g>

          {/* Stem segments — Time: structure */}
          <g fill="none" stroke="var(--chart-5)" strokeWidth="2.2" strokeLinecap="round">
            {stemSegments.map((seg, i) => (
              <motion.path
                key={i}
                d={seg.d}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.85,
                  delay: seg.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </g>

          {/* Leaves — Words: pluckable */}
          <AnimatePresence mode="popLayout">
            {leaves.map((leaf) => {
              if (pluckedId === leaf.id) return null;
              const isRippling = rippleLeafId === leaf.id;
              const canPluck = !!partnerId;
              return (
                <motion.g
                  key={leaf.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    y: leaf.y - 60,
                    opacity: 0,
                    scale: 0.3,
                    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                    delay: 0.35 + leaves.indexOf(leaf) * 0.04,
                  }}
                  style={{
                    transformOrigin: `${leaf.x}px ${leaf.y}px`,
                    cursor: canPluck ? "pointer" : "default",
                  }}
                  transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.angle})`}
                  onClick={() => canPluck && sendLeaf(leaf.id)}
                  onKeyDown={(e) => canPluck && (e.key === "Enter" || e.key === " ") && sendLeaf(leaf.id)}
                  role={canPluck ? "button" : undefined}
                  tabIndex={canPluck ? 0 : undefined}
                  aria-label={canPluck ? "Send leaf to partner" : undefined}
                >
                  {/* Ripple ring on click */}
                  <AnimatePresence>
                    {isRippling && (
                      <motion.circle
                        r={leaf.size * 3}
                        fill="none"
                        stroke="var(--chart-5)"
                        strokeWidth="0.8"
                        opacity={0.8}
                        initial={{ scale: 0.3, opacity: 0.8 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ mixBlendMode: "screen" }}
                      />
                    )}
                  </AnimatePresence>
                  <motion.path
                    d={leaf.d}
                    fill="url(#leaf-fill)"
                    stroke="rgba(52, 211, 153, 0.4)"
                    strokeWidth="0.3"
                    whileHover={canPluck ? { scale: 1.12 } : {}}
                    whileTap={canPluck ? { scale: 0.98 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Flower — Service (color) + Gifts (shape) */}
          <motion.g
            transform={`translate(${flower.cx}, ${flower.cy})`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 22,
              delay: 0.55,
            }}
          >
            {/* Outer petals */}
            {Array.from({ length: flower.petalCount }).map((_, i) => {
              const a = (i / flower.petalCount) * Math.PI * 2;
              const cx = (Math.cos(a) * flower.petalLength) / 2;
              const cy = (Math.sin(a) * flower.petalLength) / 2;
              const color = flowerColor(flower.serviceVibrancy);
              const rotDeg = (a * 180) / Math.PI;
              return (
                <motion.g
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 180,
                    delay: 0.6 + i * 0.03,
                  }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                >
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={flower.petalWidth}
                    ry={flower.petalLength}
                    fill={color}
                    opacity={0.92}
                    transform={`rotate(${rotDeg} ${cx} ${cy})`}
                  />
                </motion.g>
              );
            })}
            {/* Second layer for high Gifts */}
            {flower.giftsComplexity > 0.5 &&
              Array.from({ length: flower.petalCount }).map((_, i) => {
                const a = (i / flower.petalCount) * Math.PI * 2 + Math.PI / flower.petalCount;
                const cx = (Math.cos(a) * flower.petalLength * 0.6) / 2;
                const cy = (Math.sin(a) * flower.petalLength * 0.6) / 2;
                const color = flowerColor(Math.min(1, flower.serviceVibrancy + 0.2));
                const rotDeg = (a * 180) / Math.PI;
                return (
                  <motion.g
                    key={`inner-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      delay: 0.75 + i * 0.02,
                    }}
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  >
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={flower.petalWidth * 0.6}
                      ry={flower.petalLength * 0.6}
                      fill={color}
                      opacity={0.88}
                      transform={`rotate(${rotDeg} ${cx} ${cy})`}
                    />
                  </motion.g>
                );
              })}
            {/* Center */}
            <motion.circle
              r={flower.innerRadius}
              fill="var(--chart-2)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.85, type: "spring", stiffness: 300 }}
            />
            <motion.circle
              r={flower.innerRadius * 0.5}
              fill="var(--foreground)"
              opacity={0.9}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
            />
          </motion.g>
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
