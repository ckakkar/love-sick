"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MessageCircle } from "lucide-react";
import { useRealtimeDeepCuts } from "@/hooks/use-realtime-deep-cuts";
import type { DeepCutQuestionItem } from "@/app/api/deep-cuts/route";

export function QuestionExchange({
  coupleId,
  hasPartner,
  onAnswerSubmitted,
}: {
  coupleId: string | null;
  hasPartner: boolean;
  onAnswerSubmitted?: () => void;
}) {
  const [questions, setQuestions] = useState<DeepCutQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!coupleId) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deep-cuts?couple_id=${encodeURIComponent(coupleId)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        setQuestions([]);
      }
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useRealtimeDeepCuts(coupleId, fetchQuestions);

  const current = questions.find((q) => !q.revealed && !q.myAnswer) ?? questions.find((q) => !q.revealed);
  const revealed = questions.filter((q) => q.revealed);

  const handleSubmit = async () => {
    if (!current || !coupleId || !currentAnswer.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/deep-cuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: current.id,
          couple_id: coupleId,
          content: currentAnswer.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCurrentAnswer("");
        await fetchQuestions();
        onAnswerSubmitted?.();
      } else {
        setError(data.error || "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasPartner) {
    return (
      <Card className="card-hover glass h-full border-border/60 border-violet-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-serif text-base tracking-tight">
            <MessageCircle className="h-4 w-4 text-violet-400" />
            Question Exchange
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Link with a partner to answer deep-cut questions together. Your answers are private until you’ve both answered — then they’re revealed at once.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="card-hover glass h-full border-purple-500/10">
        <CardHeader>
          <CardTitle className="font-serif">Question Exchange</CardTitle>
          <CardDescription>Deep Cuts — answers reveal when you’ve both answered.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover glass h-full border-purple-500/10 flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 font-serif text-base tracking-tight sm:text-lg">
          <MessageCircle className="h-4 w-4 text-violet-400" />
          Question Exchange
        </CardTitle>
        <CardDescription className="text-xs">
          Answer privately; both answers unlock at once. We use these to supercharge your AI insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-0 overflow-y-auto min-h-0">
        {current && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3"
          >
            <span className="text-[10px] font-medium uppercase tracking-wider text-violet-400/90">{current.stage_label}</span>
            <p className="text-sm font-medium text-foreground">{current.prompt}</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Your answer (only your partner will see it once they’ve answered too)"
              rows={3}
              className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/20"
              disabled={submitting}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!currentAnswer.trim() || submitting}
              className="border-violet-400/30 text-violet-200 hover:bg-violet-500/10"
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="h-3 w-3 border-2" />
                  Submitting…
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </motion.div>
        )}

        {!current && questions.length > 0 && revealed.length === 0 && (
          <p className="text-xs text-muted-foreground">
            You’ve answered the current question. Waiting for your partner to answer so you can both see your responses.
          </p>
        )}

        {revealed.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Revealed</p>
            <AnimatePresence mode="popLayout">
              {revealed.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2"
                >
                  <p className="text-xs font-medium text-foreground">{q.prompt}</p>
                  <div className="grid gap-2 text-xs">
                    <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2">
                      <span className="text-[10px] uppercase text-violet-400/90">You</span>
                      <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{q.myAnswer}</p>
                    </div>
                    <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                      <span className="text-[10px] uppercase text-amber-400/90">Them</span>
                      <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{q.partnerAnswer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {questions.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">No questions available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
