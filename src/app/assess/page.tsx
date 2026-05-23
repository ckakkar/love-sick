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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ElasticSlider from "@/components/elastic-slider";
import { MessageCircle, Handshake, Gift, Clock, Heart } from "lucide-react";

const STEPS: { id: "giving" | "receiving"; title: string; subtitle: string }[] = [
  {
    id: "giving",
    title: "How you express love",
    subtitle: "Rate how naturally each way of showing love comes to you.",
  },
  {
    id: "receiving",
    title: "How you need to receive love",
    subtitle: "Rate how important each one is for you to truly feel loved.",
  },
];

const LANGUAGE_META: Record<LoveLanguageKey, { icon: React.ReactNode; color: string; desc: string }> = {
  words: {
    icon: <MessageCircle className="h-4 w-4" />,
    color: "text-violet-300",
    desc: "Compliments, encouragement, saying it out loud",
  },
  service: {
    icon: <Handshake className="h-4 w-4" />,
    color: "text-blue-300",
    desc: "Helping out, acts of care, lightening the load",
  },
  gifts: {
    icon: <Gift className="h-4 w-4" />,
    color: "text-rose-300",
    desc: "Thoughtful tokens, surprises, symbols of thought",
  },
  time: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-emerald-300",
    desc: "Undivided attention, being fully present",
  },
  touch: {
    icon: <Heart className="h-4 w-4" />,
    color: "text-pink-300",
    desc: "Hugs, hand-holding, physical closeness",
  },
};

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
    const { data: { user } } = await supabase.auth.getUser();
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

  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-[15%] left-1/2 h-[55vmax] w-[55vmax] -translate-x-1/2 rounded-full bg-[#8b5cf6]/14 blur-[120px]" />
      <div className="pointer-events-none absolute top-[40%] right-[-8%] h-[35vmax] w-[35vmax] rounded-full bg-[#f472b6]/8 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-5%] left-[5%] h-[30vmax] w-[30vmax] rounded-full bg-[#7c3aed]/7 blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 sm:mb-10"
        >
          <p className="font-serif text-lg font-semibold tracking-tight text-foreground">Love Sick</p>
          <p className="mt-1 text-sm text-muted-foreground">Your love language assessment</p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/6">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-400"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Step card */}
            <div
              className="overflow-hidden rounded-3xl border border-white/8"
              style={{
                background: "linear-gradient(160deg, rgba(22,17,38,0.96) 0%, rgba(14,11,24,0.98) 100%)",
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Top shimmer */}
              <div className="pointer-events-none h-px bg-gradient-to-r from-transparent via-violet-400/30 to-rose-400/20" />

              <div className="p-6 sm:p-8">
                {/* Step header */}
                <div className="mb-7">
                  <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {step.title}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {step.subtitle}
                  </p>
                </div>

                {/* Sliders */}
                <div className="space-y-6">
                  {LOVE_LANGUAGE_KEYS.map((key) => {
                    const meta = LANGUAGE_META[key];
                    return (
                      <div key={key} className="rounded-2xl border border-white/5 bg-white/[0.025] p-4 transition-colors hover:border-white/8 hover:bg-white/[0.035]">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`shrink-0 ${meta.color} opacity-80`}>{meta.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{LOVE_LANGUAGE_LABELS[key]}</p>
                              <p className="text-xs text-muted-foreground/80 mt-0.5">{meta.desc}</p>
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-lg font-semibold tabular-nums text-foreground/90">
                            {scores[key]}
                          </span>
                        </div>
                        <ElasticSlider
                          label=""
                          value={scores[key]}
                          onChange={(v) => updateScore(key, v)}
                          startingValue={1}
                          maxValue={10}
                          isStepped
                          stepSize={1}
                          showValue={false}
                          leftIcon={<span className="text-base leading-none">−</span>}
                          rightIcon={<span className="text-base leading-none">+</span>}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (stepIndex === 0) router.back();
                      else setStepIndex((i) => i - 1);
                    }}
                    disabled={submitting}
                    className="sm:min-w-[100px]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={submitting}
                    className="bg-gradient-to-r from-violet-500 to-rose-500 text-white shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-rose-400 sm:min-w-[160px]"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner className="h-3.5 w-3.5 border-2" />
                        Saving…
                      </>
                    ) : stepIndex < STEPS.length - 1 ? (
                      "Continue →"
                    ) : (
                      "See my dashboard →"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Foot note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center text-xs text-muted-foreground/50"
        >
          Your answers are private. Only you and your linked partner can see them.
        </motion.p>
      </div>
    </div>
  );
}
