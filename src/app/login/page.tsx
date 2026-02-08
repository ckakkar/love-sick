"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail } from "lucide-react";
import { loginWithMagicLink } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type State = "idle" | "loading" | "success" | "error";

export default function LoginPage() {
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("origin", typeof window !== "undefined" ? window.location.origin : "");

    setState("loading");
    setErrorMessage(null);

    const result = await loginWithMagicLink(formData);

    if (result?.error) {
      setState("error");
      setErrorMessage(result.error);
      return;
    }

    setState("success");
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "w-full max-w-md rounded-2xl border border-white/10 bg-card/80 p-8 shadow-2xl backdrop-blur-md",
          "ring-1 ring-white/5"
        )}
      >
        <p className="font-serif text-center text-sm uppercase tracking-widest text-muted-foreground">
          Your Digital Key
        </p>

        <div className="mt-6 flex justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-full bg-violet-500/20 p-4 ring-2 ring-violet-400/30"
          >
            <Mail className="h-10 w-10 text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
          </motion.div>
        </div>

        <h1 className="mt-6 font-serif text-2xl font-semibold tracking-tight text-foreground text-center">
          Enter the Garden.
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          No passwords to remember. Just a digital letter sent to your inbox.
        </p>

        {state === "success" ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-center text-sm text-foreground"
          >
            It is on its way. Check your inbox for the magic link.
          </motion.p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              name="email"
              required
              placeholder="Where should we send your invite?"
              disabled={state === "loading"}
              className={cn(
                "w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-foreground placeholder:text-muted-foreground",
                "focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400/20",
                "disabled:opacity-60"
              )}
            />
            {errorMessage && (
              <p className="text-center text-sm text-destructive">{errorMessage}</p>
            )}
            <Button
              type="submit"
              disabled={state === "loading"}
              className="w-full"
            >
              {state === "loading" ? "Sealing the envelope..." : "Send Letter"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="underline underline-offset-2 hover:text-foreground">
            Back home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
