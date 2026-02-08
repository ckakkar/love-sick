"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const signin = new URLSearchParams(window.location.search).get("signin");
    if (signin === "1") setLoginOpen(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-[#7c3aed]/18 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#2e1065]/20 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-32">
        <nav className="flex items-center justify-between">
          <motion.span
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-serif text-xl font-semibold tracking-tight text-foreground"
          >
            Love Sick
          </motion.span>
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center gap-3"
          >
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button size="sm" onClick={() => setLoginOpen(true)} className="glass border border-purple-500/20">
              Get Started
            </Button>
          </motion.div>
        </nav>

        <main className="mt-28 text-center md:mt-36">
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
            className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            Relationship intelligence,
            <br />
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#7c3aed] to-[#6d28d9] bg-clip-text text-transparent">
              not guesswork
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          >
            For two people in a relationship: rate the five love languages (giving and receiving),
            connect with your partner via a link, and see beautiful charts comparing how you both
            give and need love — plus AI insights on how to grow together.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => setLoginOpen(true)}
              className="min-w-[200px] shadow-lg shadow-purple-500/25"
            >
              Get Started
            </Button>
            <Link href="/assess">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Take the assessment
              </Button>
            </Link>
          </motion.div>
        </main>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-28 grid gap-5 sm:grid-cols-3"
        >
          {[
            { title: "5 languages", desc: "Words, Service, Gifts, Time, Touch" },
            { title: "Your fingerprint", desc: "Radar & gap analysis" },
            { title: "AI insights", desc: "How to grow together" },
          ].map((block, i) => (
            <motion.div
              key={block.title}
              variants={item}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="card-hover rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-xl"
            >
              <div className="text-center">
                <div className="text-xl font-semibold text-foreground">{block.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{block.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
