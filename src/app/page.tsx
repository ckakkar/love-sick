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
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      {/* Soft ambient glows — layered, smoother */}
      <div className="pointer-events-none absolute -top-[35%] left-1/2 h-[75vmax] w-[75vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/12 blur-[160px] transition-opacity duration-1000" />
      <div className="pointer-events-none absolute bottom-[15%] right-[-15%] h-[55vmax] w-[55vmax] rounded-full bg-[#2d2640]/50 blur-[120px]" />
      <div className="pointer-events-none absolute top-[45%] left-[-8%] h-[45vmax] w-[45vmax] rounded-full bg-[#7c3aed]/6 blur-[100px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-6 sm:py-8">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-90">
            Love Sick
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground transition-colors duration-200 hover:text-foreground hover:bg-violet-500/10">
              Sign in
            </Button>
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center pb-20 pt-4 md:flex-row md:items-center md:gap-8 md:pb-24">
          <div className="min-w-0 flex-1 md:max-w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/12 bg-violet-500/8 px-4 py-2 text-xs font-medium tracking-wide text-violet-200/95 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300/90" />
            Romance is creation, not consumption
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 font-serif text-4xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Know how you love.
            <br />
            <span className="text-muted-foreground/95">See how you match.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-md text-base leading-[1.65] text-muted-foreground"
          >
            For the two of you: five love languages, a shared dashboard, and AI that suggests ways to grow together — without the usual “buy this” noise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button size="lg" asChild className="group min-w-[180px] shadow-lg shadow-violet-500/20">
              <Link href="/login">
                Begin
                <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Link
              href="/assess"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-foreground"
            >
              Take the assessment first →
            </Link>
          </motion.div>
          </div>

          {/* Auto-cycling feature cards — right side takes more space */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="relative mt-16 flex min-h-[420px] w-full shrink-0 md:mt-0 md:min-h-[480px] md:min-w-[min(100%,520px)] md:flex-1 md:basis-0"
          >
            <CardSwap
              width={400}
              height={360}
              cardDistance={56}
              verticalDistance={64}
              delay={4500}
              pauseOnHover
              skewAmount={5}
              easing="elastic"
              className="w-full"
            >
              {FEATURE_CARDS.map((card, i) => (
                <Card key={i} className="flex flex-col justify-center p-8 glass border-violet-500/10 shadow-xl shadow-violet-500/5">
                  <h3 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-base leading-[1.6] text-muted-foreground">
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
          transition={{ duration: 0.65, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-border/50 pt-12"
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
                <li key={i} className="leading-relaxed text-muted-foreground pl-4 border-l-2 border-violet-500/20">
                  {line}
                </li>
              ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
