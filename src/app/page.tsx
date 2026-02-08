"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CardSwap, { Card } from "@/components/card-swap";

const FEATURE_CARDS = [
  {
    title: "Five love languages",
    body: "Words, service, gifts, quality time, touch — discover how you give and receive love.",
  },
  {
    title: "Your fingerprint",
    body: "A shared radar and gap analysis so you and your partner see where you align and where to grow.",
  },
  {
    title: "Digital garden",
    body: "Your love language as a plant. Pick a leaf and send it to your partner as a little reminder.",
  },
  {
    title: "AI that gets you",
    body: "Insights on how to grow together — not what to buy, but how to show up for each other.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Soft ambient glows — warm violet + hint of rose */}
      <div className="pointer-events-none absolute -top-[40%] left-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[20%] right-[-20%] h-[50vmax] w-[50vmax] rounded-full bg-[#2d2640]/60 blur-[100px]" />
      <div className="pointer-events-none absolute top-[50%] left-[-10%] h-[40vmax] w-[40vmax] rounded-full bg-[#7c3aed]/5 blur-[80px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6">
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground">
            Love Sick
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground transition-colors duration-300 hover:text-foreground">
              Sign in
            </Button>
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center pb-20 pt-4 md:flex-row md:items-center md:gap-12 md:pb-24">
          <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-500/5 px-3.5 py-2 text-xs tracking-wide text-violet-200/90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Romance is creation, not consumption
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.32, 0.72, 0, 1] }}
            className="mt-7 font-serif text-4xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Know how you love.
            <br />
            <span className="text-muted-foreground">See how you match.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.14, ease: [0.32, 0.72, 0, 1] }}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground"
          >
            For the two of you: five love languages, a shared dashboard, and AI that suggests ways to grow together — without the usual “buy this” noise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button size="lg" asChild className="group min-w-[180px]">
              <Link href="/login">
                Begin
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Link
              href="/assess"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-300 hover:text-foreground"
            >
              Take the assessment first →
            </Link>
          </motion.div>
          </div>

          {/* Auto-cycling feature cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="relative mt-16 min-h-[380px] w-full shrink-0 md:mt-0 md:min-h-[420px] md:max-w-[480px]"
          >
            <CardSwap
              width={320}
              height={280}
              cardDistance={48}
              verticalDistance={56}
              delay={4500}
              pauseOnHover
              skewAmount={5}
              easing="elastic"
            >
              {FEATURE_CARDS.map((card, i) => (
                <Card key={i} className="flex flex-col justify-center p-6">
                  <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.body}
                  </p>
                </Card>
              ))}
            </CardSwap>
          </motion.div>
        </main>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="border-t border-border/60 pt-12"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
            What you get
          </p>
          <ul className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
              {[
                "Five languages — words, service, gifts, time, touch",
                "Your fingerprint — radar and gap analysis with your partner",
                "AI insights — how to grow together, not what to buy",
              ].map((line, i) => (
                <li key={i} className="leading-relaxed text-muted-foreground">
                  {line}
                </li>
              ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
