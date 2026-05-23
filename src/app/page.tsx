"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CardSwap, { Card } from "@/components/card-swap";

const FEATURE_CARDS = [
  {
    title: "Five love languages",
    body: "Words, service, gifts, quality time, touch — rate how you give and need to receive love.",
  },
  {
    title: "Your fingerprint",
    body: "Shared radar charts and compatibility overlap: see where you're matched, one-sided, or have a gap to grow.",
  },
  {
    title: "Question Exchange",
    body: "Deep-cut prompts you both answer privately; answers unlock at once. We use them to supercharge your AI insights.",
  },
  {
    title: "AI that gets you",
    body: "Insights on how to grow together — not what to buy, but how to show up for each other.",
  },
];

export default function LandingPage() {
  const [cardDims, setCardDims] = useState({ h: 320, cd: 56, vd: 64 });

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setCardDims(
        mobile
          ? { h: 220, cd: 18, vd: 20 }
          : { h: 320, cd: 56, vd: 64 }
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      {/* Ambient glows — violet + rose warmth */}
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/14 blur-[160px]" />
      <div className="pointer-events-none absolute top-[20%] right-[-10%] h-[50vmax] w-[50vmax] rounded-full bg-[#f472b6]/7 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-[10%] left-[-8%] h-[40vmax] w-[40vmax] rounded-full bg-[#7c3aed]/8 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[20%] h-[35vmax] w-[35vmax] rounded-full bg-[#f472b6]/5 blur-[120px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6">

        {/* Nav */}
        <header className="flex items-center justify-between py-5 sm:py-7">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80">
            Love Sick
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-white/5">
              Sign in
            </Button>
          </Link>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col justify-center pb-16 pt-2 md:flex-row md:items-center md:gap-12 md:pb-24">
          <div className="min-w-0 flex-1 md:max-w-[440px]">

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/15 bg-rose-500/8 px-4 py-2 text-xs font-medium tracking-wide text-rose-200/90 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-300/80" />
              Romance is creation, not consumption
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-foreground sm:mt-8 sm:text-5xl md:text-5xl lg:text-6xl"
            >
              Know how you love.
              <br />
              <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-rose-300 bg-clip-text text-transparent">
                See how you match.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 max-w-md text-base leading-[1.7] text-muted-foreground sm:mt-6"
            >
              For the two of you: five love languages, a shared dashboard, and AI that suggests ways to grow together — without the usual "buy this" noise.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.20, ease: [0.32, 0.72, 0, 1] }}
              className="mt-9 sm:mt-10"
            >
              <Button
                size="lg"
                asChild
                className="group w-full bg-gradient-to-r from-violet-500 via-violet-500 to-rose-500 text-white shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 hover:from-violet-400 hover:via-violet-400 hover:to-rose-400 sm:w-auto sm:min-w-[200px]"
              >
                <Link href="/login">
                  Begin your story
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Card stack */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="relative mt-10 flex min-h-[280px] w-full shrink-0 overflow-hidden sm:min-h-[380px] md:mt-0 md:min-h-[420px] md:overflow-visible lg:min-h-[480px] md:min-w-[min(100%,520px)] md:flex-1 md:basis-0"
          >
            <CardSwap
              width="min(100%, 400px)"
              height={cardDims.h}
              cardDistance={cardDims.cd}
              verticalDistance={cardDims.vd}
              delay={4500}
              pauseOnHover
              skewAmount={5}
              easing="elastic"
              className="w-full"
            >
              {FEATURE_CARDS.map((card, i) => (
                <Card
                  key={i}
                  className="flex flex-col justify-center p-6 sm:p-8"
                  style={{
                    background: "rgba(17, 13, 30, 0.88)",
                    borderColor: "rgba(167, 139, 250, 0.14)",
                    boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <h3 className="font-serif text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-[1.65] text-muted-foreground sm:text-base">
                    {card.body}
                  </p>
                </Card>
              ))}
            </CardSwap>
          </motion.div>
        </main>

        {/* Footer feature strip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-border/25 py-7 sm:py-9"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/50 sm:text-xs">
            What's inside
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground/80 sm:text-sm">
            {[
              "Five love languages",
              "Fingerprint & compatibility overlap",
              "Question Exchange",
              "AI insights — how to grow together",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-rose-500/30 hidden sm:inline">·</span>}
                {item}
              </span>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
