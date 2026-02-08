"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Slider from "@radix-ui/react-slider";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LOVE_LANGUAGE_KEYS,
  LOVE_LANGUAGE_LABELS,
  type LoveScores,
  type LoveLanguageKey,
  DEFAULT_SCORES,
} from "@/types/assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS: { id: "giving" | "receiving"; title: string; subtitle: string }[] = [
  { id: "giving", title: "How you express love", subtitle: "Rate how naturally you show love in each way." },
  { id: "receiving", title: "How you need to receive love", subtitle: "Rate how important each is for you to feel loved." },
];

function ScoreSlider({
  value,
  onChange,
  label,
  index,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  index: number;
}) {
  const gradientProgress = value / 10;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">{value}</span>
      </div>
      <Slider.Root
        className="relative flex h-8 w-full touch-none select-none items-center"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
      >
        <Slider.Track
          className={cn(
            "relative h-2.5 w-full grow overflow-hidden rounded-full transition-all duration-300"
          )}
          style={{
            background: `linear-gradient(90deg, #2e2638 0%, #3b2d4a ${Math.max(0, (gradientProgress - 0.15) * 100)}%, #8b5cf6 ${gradientProgress * 100}%, #a78bfa 100%)`,
          }}
        >
          <Slider.Range className="absolute h-full bg-transparent" />
        </Slider.Track>
        <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-[#8b5cf6] bg-background shadow-lg shadow-purple-500/30 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 focus:ring-offset-background" />
      </Slider.Root>
    </div>
  );
}

export default function AssessPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [giving, setGiving] = useState<LoveScores>({ ...DEFAULT_SCORES });
  const [receiving, setReceiving] = useState<LoveScores>({ ...DEFAULT_SCORES });
  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[stepIndex];
  const isGiving = step.id === "giving";
  const scores = isGiving ? giving : receiving;
  const setScores = isGiving ? setGiving : setReceiving;

  const updateScore = useCallback(
    (key: LoveLanguageKey, value: number) => {
      setScores((prev) => ({ ...prev, [key]: value }));
    },
    [setScores]
  );

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from("assessments").insert({
        user_id: user.id,
        giving_scores: giving,
        receiving_scores: receiving,
      });
      if (!error) {
        router.push("/dashboard");
        return;
      }
    }
    router.push("/dashboard");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="pointer-events-none absolute left-1/2 top-20 h-64 w-[500px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/15 blur-[80px]" />
      <div className="relative mx-auto max-w-2xl px-6 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="card-hover glass border-purple-500/10">
              <CardHeader>
                <p className="text-xs font-medium uppercase tracking-wider text-[#a78bfa]/80">
                  Step {stepIndex + 1} of 2
                </p>
                <CardTitle className="text-2xl">{step.title}</CardTitle>
                <CardDescription className="text-base">{step.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {LOVE_LANGUAGE_KEYS.map((key, i) => (
                  <ScoreSlider
                    key={key}
                    label={LOVE_LANGUAGE_LABELS[key]}
                    value={scores[key]}
                    onChange={(v) => updateScore(key, v)}
                    index={i}
                  />
                ))}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={submitting}>
                    {stepIndex < STEPS.length - 1
                      ? "Next"
                      : submitting
                        ? "Saving…"
                        : "See my dashboard"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
