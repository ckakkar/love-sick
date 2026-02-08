"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getCoupleInsight } from "@/app/actions/insight";
import { PrologueModal } from "@/components/prologue-modal";
import type { CoachOutput } from "@/lib/ai/insight";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Link from "next/link";
import {
  LOVE_LANGUAGE_KEYS,
  LOVE_LANGUAGE_LABELS,
  type LoveScores,
} from "@/types/assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalGarden } from "@/components/digital-garden";
import { usePartnerPresence } from "@/hooks/use-presence";
import { cn } from "@/lib/utils";

const LABELS_SHORT: Record<string, string> = {
  words: "Words",
  service: "Service",
  gifts: "Gifts",
  time: "Time",
  touch: "Touch",
};

function buildRadarData(scores: LoveScores, partnerScores?: LoveScores | null) {
  return LOVE_LANGUAGE_KEYS.map((key) => ({
    subject: LABELS_SHORT[key],
    fullMark: 10,
    value: scores[key],
    partnerValue: partnerScores ? partnerScores[key] : undefined,
    key,
  }));
}

const DEFAULT_SCORES: LoveScores = {
  words: 5,
  service: 5,
  gifts: 5,
  time: 5,
  touch: 5,
};

export function DashboardClient({
  myGiving,
  myReceiving,
  partnerGiving,
  partnerReceiving,
  hasPartner,
  partnerId,
  coupleId,
  hasPrologue,
  inviteCode,
  isInviter,
}: {
  myGiving: LoveScores | null;
  myReceiving: LoveScores | null;
  partnerGiving: LoveScores | null;
  partnerReceiving: LoveScores | null;
  hasPartner: boolean;
  partnerId: string | null;
  coupleId: string | null;
  hasPrologue: boolean;
  inviteCode: string | null;
  isInviter: boolean;
}) {
  const giving = myGiving ?? DEFAULT_SCORES;
  const receiving = myReceiving ?? DEFAULT_SCORES;
  const loading = myGiving === null && myReceiving === null;
  const [insight, setInsight] = useState<CoachOutput | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [prologueUnlocked, setPrologueUnlocked] = useState(hasPrologue);
  const [dissolving, setDissolving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const partnerOnline = usePartnerPresence(coupleId, partnerId);
  const prevOnlineRef = useRef(false);
  const showPrologueGate = hasPartner && partnerId && (!prologueUnlocked || dissolving);

  useEffect(() => {
    if (partnerOnline && !prevOnlineRef.current && partnerId) {
      setToast("She is here with you.");
      setTimeout(() => setToast(null), 4000);
    }
    prevOnlineRef.current = partnerOnline;
  }, [partnerOnline, partnerId]);

  const handlePrologueUnlock = () => {
    setDissolving(true);
  };

  const handleLeafSent = () => {
    setToast("Leaf sent to your partner");
    setTimeout(() => setToast(null), 3000);
  };

  const radarData = buildRadarData(giving, partnerGiving);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  };
  const cardItem = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className={cn("min-h-screen bg-background gradient-mesh transition-all duration-500", partnerOnline && "rounded-lg border-2 border-[var(--sync-glow)] sync-glow")}>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-card px-4 py-2 text-sm shadow-lg"
        >
          {toast}
        </motion.div>
      )}
      {/* Prologue gate overlay: blur dissolves in 1.5s after submit */}
      {showPrologueGate && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-background/90 backdrop-blur-xl"
            initial={false}
            animate={{ opacity: dissolving ? 0 : 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            onAnimationComplete={() => {
              if (dissolving) {
                setDissolving(false);
                setPrologueUnlocked(true);
              }
            }}
          />
          {!dissolving && partnerId && (
            <PrologueModal partnerId={partnerId} onUnlock={handlePrologueUnlock} />
          )}
        </>
      )}

      <div className="pointer-events-none fixed left-1/2 top-0 h-96 w-[600px] -translate-x-1/2 rounded-full bg-[#7c3aed]/12 blur-[100px]" />
      <div className="relative mx-auto max-w-7xl px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Understand each other’s love language</p>
          </div>
          <div className="flex items-center gap-3">
            {partnerOnline && (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-[var(--sync-glow)]"
                title="Partner is here"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </motion.span>
            )}
            <Link href="/assess">
              <Button variant="outline" size="sm">
                Retake assessment
              </Button>
            </Link>
          </div>
        </motion.header>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 lg:grid-cols-2"
        >
          {/* Radar */}
          <motion.div variants={cardItem}>
          <Card className="card-hover glass border-purple-500/10">
            <CardHeader>
              <CardTitle>The Fingerprint</CardTitle>
              <CardDescription>
                Giving vs receiving — {hasPartner ? "You (purple) & partner (violet)" : "You"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[320px] w-full rounded-lg" />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 10]}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      />
                      <Radar
                        name="You (Giving)"
                        dataKey="value"
                        stroke="#a78bfa"
                        fill="#a78bfa"
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                      {hasPartner && partnerGiving && (
                        <Radar
                          name="Partner (Giving)"
                          dataKey="partnerValue"
                          stroke="#c4b5fd"
                          fill="#c4b5fd"
                          fillOpacity={0.28}
                          strokeWidth={2}
                        />
                      )}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* Digital Garden */}
          <motion.div variants={cardItem}>
          <Card className="card-hover glass border-purple-500/10">
            <CardHeader>
              <CardTitle className="font-serif">Digital Garden</CardTitle>
              <CardDescription>
                Your love language as a plant — roots (Touch), stem (Time), leaves (Words), flower (Service & Gifts). Pick a leaf to send to your partner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[320px] w-full rounded-lg" />
              ) : (
                <DigitalGarden
                  scores={giving}
                  partnerId={partnerId}
                  onLeafSent={handleLeafSent}
                />
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* Heatmap */}
          <motion.div variants={cardItem} className="lg:col-span-2">
          <Card className="card-hover glass border-purple-500/10 lg:col-span-2">
            <CardHeader>
              <CardTitle>Intensity grid</CardTitle>
              <CardDescription>Giving (row) vs receiving (column) — 1–10</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[220px] w-full rounded-lg" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-border p-2 text-left text-xs text-muted-foreground" />
                        {LOVE_LANGUAGE_KEYS.map((k) => (
                          <th
                            key={k}
                            className="border border-border p-2 text-center text-xs text-muted-foreground"
                          >
                            {LABELS_SHORT[k]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-2 text-xs text-muted-foreground">Giving</td>
                        {LOVE_LANGUAGE_KEYS.map((k) => {
                          const v = giving[k];
                          const opacity = 0.2 + (v / 10) * 0.8;
                          return (
                            <td
                              key={k}
                              className="border border-border p-2 text-center text-sm font-medium"
                              style={{
                                backgroundColor: `rgba(139, 92, 246, ${opacity})`,
                                color: v >= 6 ? "#fff" : "var(--foreground)",
                              }}
                            >
                              {v}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="border border-border p-2 text-xs text-muted-foreground">Receiving</td>
                        {LOVE_LANGUAGE_KEYS.map((k) => {
                          const v = receiving[k];
                          const opacity = 0.2 + (v / 10) * 0.8;
                          return (
                            <td
                              key={k}
                              className="border border-border p-2 text-center text-sm font-medium"
                              style={{
                                backgroundColor: `rgba(196, 181, 253, ${opacity})`,
                                color: v >= 6 ? "#0c0a0f" : "var(--foreground)",
                              }}
                            >
                              {v}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>

          {/* AI Insight */}
          {hasPartner && partnerGiving && partnerReceiving && (
            <motion.div variants={cardItem} className="lg:col-span-2">
            <Card className="card-hover glass border-purple-500/10 lg:col-span-2">
              <CardHeader>
              <CardTitle>How to grow together</CardTitle>
              <CardDescription>
                AI insight from both of your love languages — how to love each other the right way.
              </CardDescription>
              </CardHeader>
              <CardContent>
                {insightLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </div>
                ) : insight ? (
                  <div className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {insight.relationshipPrescription}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {insight.threeDates.map((d, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-purple-500/15 bg-muted/40 p-4 transition-colors hover:border-purple-500/25"
                        >
                          <div className="font-medium text-foreground">{d.title}</div>
                          <p className="mt-1 text-sm text-muted-foreground">{d.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={async () => {
                      setInsightLoading(true);
                      try {
                        const result = await getCoupleInsight(
                          giving,
                          receiving,
                          partnerGiving,
                          partnerReceiving
                        );
                        setInsight(result.coach);
                      } finally {
                        setInsightLoading(false);
                      }
                    }}
                  >
                    Generate insight
                  </Button>
                )}
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Sync with Partner */}
          <motion.div variants={cardItem} className="lg:col-span-2">
          <Card className="card-hover glass border-purple-500/10 lg:col-span-2">
            <CardHeader>
              <CardTitle>Connect with your partner</CardTitle>
              <CardDescription>
                {hasPartner
                  ? "You’re linked. Only two people can connect at a time."
                  : "Generate a link and send it to your partner. They sign in, take the assessment, and you can compare love languages."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SyncPartnerCard
                hasPartner={hasPartner}
                inviteCode={inviteCode}
                isInviter={isInviter}
              />
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function SyncPartnerCard({
  hasPartner,
  inviteCode,
  isInviter,
}: {
  hasPartner: boolean;
  inviteCode: string | null;
  isInviter: boolean;
}) {
  const [code, setCode] = useState(inviteCode);
  const [creating, setCreating] = useState(false);
  const [alreadyLinkedError, setAlreadyLinkedError] = useState(false);

  const createInvite = async () => {
    setCreating(true);
    setAlreadyLinkedError(false);
    const res = await fetch("/api/invite/create", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409 && data.error === "already_linked") {
      setAlreadyLinkedError(true);
    } else if (data.code) {
      setCode(data.code);
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      {!hasPartner && (
        <>
          {alreadyLinkedError && (
            <p className="rounded-lg bg-purple-500/10 px-3 py-2 text-sm text-[#c4b5fd]">
              You’re already linked with a partner. Only two people can connect at a time.
            </p>
          )}
          {code ? (
            <div className="rounded-xl border border-purple-500/15 bg-muted/40 p-4">
              <p className="mb-2 text-sm text-muted-foreground">Share this link with your partner so they can connect and compare love languages:</p>
              <code className="block break-all rounded-lg bg-background/80 px-3 py-2 text-sm text-foreground ring-1 ring-purple-500/10">
                {typeof window !== "undefined" ? `${window.location.origin}/invite?code=${code}` : `.../invite?code=${code}`}
              </code>
            </div>
          ) : (
            <Button onClick={createInvite} disabled={creating}>
              {creating ? "Creating…" : "Generate link for partner"}
            </Button>
          )}
        </>
      )}
      {hasPartner && isInviter && inviteCode && (
        <p className="text-sm text-muted-foreground">
          You’re linked. Share the link above if your partner needs it again.
        </p>
      )}
      {hasPartner && !isInviter && (
        <p className="text-sm text-muted-foreground">You’re linked with your partner. Compare your love languages above.</p>
      )}
    </div>
  );
}
