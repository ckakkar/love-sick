"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

const MIN_CHARS = 150;

export function PrologueModal({
  onUnlock,
  partnerId,
}: {
  onUnlock: () => void;
  partnerId: string;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = content.trim().length;
  const valid = count >= MIN_CHARS;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/prologue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), partner_id: partnerId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onUnlock();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity duration-300",
          submitting && "cursor-wait opacity-90"
        )}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-border/80 bg-card p-4 shadow-2xl shadow-violet-500/5 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Data is meaningless without intent
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          To unlock your compatibility profile, write at least {MIN_CHARS} characters about why you chose this person.
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Why did you choose them? What do you want to build together?"
          className="mt-4 min-h-[140px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          maxLength={600}
          rows={5}
        />
        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "text-xs tabular-nums",
              count >= MIN_CHARS ? "text-[var(--chart-5)]" : "text-muted-foreground"
            )}
          >
            {count} / {MIN_CHARS}
          </span>
          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!valid || submitting}
          className="mt-4 w-full"
        >
          {submitting ? (
            <>
              <LoadingSpinner className="h-3.5 w-3.5 border-2" />
              Unlocking…
            </>
          ) : (
            "Unlock my profile"
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
