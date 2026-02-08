"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
          "absolute inset-0 bg-background/80 backdrop-blur-xl",
          "prologue-overlay"
        )}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
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
          className="mt-4 min-h-[140px] w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
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
          {submitting ? "Unlocking…" : "Unlock my profile"}
        </Button>
      </motion.div>
    </motion.div>
  );
}
