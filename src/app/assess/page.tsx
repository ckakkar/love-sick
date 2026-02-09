"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ElasticSlider from "@/components/elastic-slider";

const STEPS: { id: "giving" | "receiving"; title: string; subtitle: string }[] = [
  { id: "giving", title: "How you express love", subtitle: "Rate how naturally you show love in each way." },
  { id: "receiving", title: "How you need to receive love", subtitle: "Rate how important each is for you to feel loved." },
];

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
      <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <Card className="card-hover glass border-border/60 border-violet-500/10 shadow-xl shadow-violet-500/10">
              <CardHeader className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-400/90">
                  Step {stepIndex + 1} of 2
                </p>
                <CardTitle className="text-2xl sm:text-3xl font-semibold tracking-tight">{step.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{step.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-2">
                {LOVE_LANGUAGE_KEYS.map((key) => (
                  <ElasticSlider
                    key={key}
                    label={LOVE_LANGUAGE_LABELS[key]}
                    value={scores[key]}
                    onChange={(v) => updateScore(key, v)}
                    startingValue={1}
                    maxValue={10}
                    isStepped
                    stepSize={1}
                    leftIcon={<span className="text-lg">−</span>}
                    rightIcon={<span className="text-lg">+</span>}
                  />
                ))}
                <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-between sm:pt-4">
                  <Button
                    variant="outline"
                    className="sm:min-w-[100px]"
                    onClick={() => {
                      if (stepIndex === 0) {
                        router.back();
                      } else {
                        setStepIndex((i) => i - 1);
                      }
                    }}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={submitting} className="w-full sm:w-auto sm:min-w-[140px]">
                    {submitting ? (
                      <>
                        <LoadingSpinner className="h-3.5 w-3.5 border-2" />
                        {stepIndex < STEPS.length - 1 ? "Next" : "Saving…"}
                      </>
                    ) : stepIndex < STEPS.length - 1 ? (
                      "Next"
                    ) : (
                      "See my dashboard"
                    )}
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
