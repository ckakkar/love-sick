"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getCoupleInsight, getSoloInsight } from "@/app/actions/insight";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LOVE_LANGUAGE_KEYS, type LoveScores } from "@/types/assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DigitalGarden } from "@/components/digital-garden";
import { WeathervaneCard } from "@/components/dashboard/weathervane-card";
import { TimeDifferenceCard } from "@/components/dashboard/time-difference-card";
import { StreakCounterCard } from "@/components/dashboard/streak-counter-card";
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

function buildBarData(scores: LoveScores, partnerScores?: LoveScores | null) {
  return LOVE_LANGUAGE_KEYS.map((key) => ({
    subject: LABELS_SHORT[key],
    you: scores[key],
    partner: partnerScores ? partnerScores[key] : undefined,
  }));
}

const DEFAULT_SCORES: LoveScores = {
  words: 5,
  service: 5,
  gifts: 5,
  time: 5,
  touch: 5,
};

/* Bar chart hover: active bar style + animated tooltip */
const barActiveBarYou = { fill: "#c4b5fd", fillOpacity: 1, stroke: "rgba(167,139,250,0.5)", strokeWidth: 2 };
const barActiveBarPartner = { fill: "#ddd6fe", fillOpacity: 1, stroke: "rgba(196,181,253,0.5)", strokeWidth: 2 };

function BarChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border/80 bg-card px-3 py-2 shadow-xl shadow-violet-500/10"
    >
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-muted-foreground">: {value}</p>
    </motion.div>
  );
}

type PartnerRequestSent = { id: string; to_username: string | null; to_name: string | null; created_at: string };
type PartnerRequestReceived = { id: string; from_username: string | null; from_name: string | null; created_at: string };

export function DashboardClient({
  myGiving,
  myReceiving,
  partnerGiving,
  partnerReceiving,
  hasPartner,
  partnerId,
  coupleId,
  hasPrologue,
  partnerRequests,
  myUsername,
  hasAssessment,
  notifyPartnerOnline = true,
}: {
  myGiving: LoveScores | null;
  myReceiving: LoveScores | null;
  partnerGiving: LoveScores | null;
  partnerReceiving: LoveScores | null;
  hasPartner: boolean;
  partnerId: string | null;
  coupleId: string | null;
  hasPrologue: boolean;
  partnerRequests: { sent: PartnerRequestSent[]; received: PartnerRequestReceived[] };
  myUsername: string | null;
  hasAssessment: boolean;
  notifyPartnerOnline?: boolean;
}) {
  const giving = myGiving ?? DEFAULT_SCORES;
  const receiving = myReceiving ?? DEFAULT_SCORES;
  const loading = myGiving === null && myReceiving === null;
  const [insight, setInsight] = useState<CoachOutput | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [soloInsight, setSoloInsight] = useState<CoachOutput | null>(null);
  const [soloInsightLoading, setSoloInsightLoading] = useState(false);
  const [fingerprintChartType, setFingerprintChartType] = useState<"radar" | "bar">("radar");
  const [receivingChartType, setReceivingChartType] = useState<"radar" | "bar">("radar");
  const [prologueUnlocked, setPrologueUnlocked] = useState(hasPrologue);
  const [dissolving, setDissolving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const partnerOnline = usePartnerPresence(coupleId, partnerId);
  const prevOnlineRef = useRef(false);
  const showPrologueGate = hasPartner && partnerId && (!prologueUnlocked || dissolving);
  const showPartnerOnlineToast = notifyPartnerOnline !== false;

  useEffect(() => {
    if (showPartnerOnlineToast && partnerOnline && !prevOnlineRef.current && partnerId) {
      setToast("Your partner is here with you.");
      setTimeout(() => setToast(null), 4000);
    }
    prevOnlineRef.current = partnerOnline;
  }, [showPartnerOnlineToast, partnerOnline, partnerId]);

  const handlePrologueUnlock = () => {
    setDissolving(true);
  };

  const handleLeafSent = () => {
    setToast("Leaf sent to your partner");
    setTimeout(() => setToast(null), 3000);
  };

  const radarData = buildRadarData(giving, partnerGiving);
  const receivingRadarData = buildRadarData(receiving, partnerReceiving);

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
    <div className={cn("min-h-screen bg-background gradient-mesh dashboard-bg transition-all duration-500", partnerOnline && "rounded-lg border-2 border-[var(--sync-glow)] sync-glow")}>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border/80 bg-card/95 px-4 py-2.5 text-sm shadow-xl shadow-violet-500/10 backdrop-blur-xl"
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
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
          className="bento-grid"
        >
          {!hasAssessment && (
            <motion.div variants={cardItem} className="bento-cell col-span-4 lg:col-span-4">
              <Card className="border-violet-400/30 bg-violet-500/10">
                <CardHeader>
                  <CardTitle>Discover your love language</CardTitle>
                  <CardDescription>
                    Take a short assessment so we can show your fingerprint and compare with your partner.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/assess">
                    <Button>Take the assessment</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}
          {/* Row 1: Weathervane, Time Difference, Streak */}
          <motion.div variants={cardItem} className="bento-cell col-span-2 lg:col-span-1">
            <WeathervaneCard hasPartner={hasPartner} data={null} />
          </motion.div>
          <motion.div variants={cardItem} className="bento-cell col-span-2 lg:col-span-1">
            <TimeDifferenceCard hasPartner={hasPartner} data={null} />
          </motion.div>
          <motion.div variants={cardItem} className="bento-cell col-span-2 lg:col-span-1">
            <StreakCounterCard hasPartner={hasPartner} data={null} />
          </motion.div>
          {hasPartner && (
            <motion.div variants={cardItem} className="bento-cell col-span-2 lg:col-span-1">
              <Card className="card-hover glass h-full border-border/60 border-violet-500/10 flex flex-col items-center justify-center py-4">
                {partnerOnline ? (
                  <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-[var(--sync-glow)]">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </motion.span>
                ) : null}
                <p className="mt-1 text-xs font-medium text-muted-foreground">Partner {partnerOnline ? "here" : "away"}</p>
              </Card>
            </motion.div>
          )}
          {/* Fingerprint — Radar or Bar (large) */}
          <motion.div variants={cardItem} className="bento-cell col-span-2 row-span-2">
            <Card className="card-hover overflow-hidden border border-border/60 bg-card/80 shadow-lg shadow-violet-500/5 backdrop-blur-sm">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                  <CardTitle className="font-serif text-lg tracking-tight">The Fingerprint</CardTitle>
                  <CardDescription className="mt-1 text-xs text-muted-foreground">
                    How you give love — {hasPartner ? "you vs partner" : "your scores"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Chart</span>
                  <select
                    value={fingerprintChartType}
                    onChange={(e) => setFingerprintChartType(e.target.value as "radar" | "bar")}
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/80 pl-3 pr-8 text-sm text-foreground outline-none transition-all duration-200",
                      "hover:border-violet-400/30 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20"
                    )}
                  >
                    <option value="radar">Radar</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <Skeleton className="h-[320px] w-full rounded-xl" />
                ) : fingerprintChartType === "radar" ? (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 16, right: 24, left: 24, bottom: 16 }}>
                        <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
                          axisLine={false}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 10]}
                          tick={false}
                        />
                        <Radar
                          name="You (Giving)"
                          dataKey="value"
                          stroke="#a78bfa"
                          fill="#a78bfa"
                          fillOpacity={0.35}
                          strokeWidth={2}
                        />
                        {hasPartner && partnerGiving && (
                          <Radar
                            name="Partner (Giving)"
                            dataKey="partnerValue"
                            stroke="#c4b5fd"
                            fill="#c4b5fd"
                            fillOpacity={0.22}
                            strokeWidth={2}
                          />
                        )}
                        <Legend
                          wrapperStyle={{ fontSize: 11 }}
                          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={buildBarData(giving, partnerGiving)}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 56, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                        <XAxis type="number" domain={[0, 10]} tick={false} axisLine={false} />
                        <YAxis type="category" dataKey="subject" width={52} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<BarChartTooltip />} cursor={{ fill: "rgba(167,139,250,0.06)", radius: 8 }} />
                        <Bar
                          dataKey="you"
                          name="You"
                          fill="#a78bfa"
                          fillOpacity={0.9}
                          radius={[0, 6, 6, 0]}
                          maxBarSize={28}
                          animationDuration={400}
                          animationEasing="ease-out"
                          activeBar={barActiveBarYou}
                        />
                        {hasPartner && partnerGiving && (
                          <Bar
                            dataKey="partner"
                            name="Partner"
                            fill="#c4b5fd"
                            fillOpacity={0.8}
                            radius={[0, 6, 6, 0]}
                            maxBarSize={28}
                            animationDuration={400}
                            animationEasing="ease-out"
                            activeBar={barActiveBarPartner}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Receiving — Radar or Bar (large) */}
          <motion.div variants={cardItem} className="bento-cell col-span-2 row-span-2">
            <Card className="card-hover overflow-hidden h-full border border-border/60 bg-card/80 shadow-lg shadow-violet-500/5 backdrop-blur-sm">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                  <CardTitle className="font-serif text-lg tracking-tight">How you need to receive love</CardTitle>
                  <CardDescription className="mt-1 text-xs text-muted-foreground">
                    What makes you feel loved — {hasPartner ? "you vs partner" : "your scores"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Chart</span>
                  <select
                    value={receivingChartType}
                    onChange={(e) => setReceivingChartType(e.target.value as "radar" | "bar")}
                    className={cn(
                      "flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border/60 bg-background/80 pl-3 pr-8 text-sm text-foreground outline-none transition-all duration-200",
                      "hover:border-violet-400/30 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20"
                    )}
                  >
                    <option value="radar">Radar</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <Skeleton className="h-[320px] w-full rounded-xl" />
                ) : receivingChartType === "radar" ? (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={receivingRadarData} margin={{ top: 16, right: 24, left: 24, bottom: 16 }}>
                        <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
                          axisLine={false}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 10]}
                          tick={false}
                        />
                        <Radar
                          name="You (Receiving)"
                          dataKey="value"
                          stroke="#a78bfa"
                          fill="#a78bfa"
                          fillOpacity={0.35}
                          strokeWidth={2}
                        />
                        {hasPartner && partnerReceiving && (
                          <Radar
                            name="Partner (Receiving)"
                            dataKey="partnerValue"
                            stroke="#c4b5fd"
                            fill="#c4b5fd"
                            fillOpacity={0.22}
                            strokeWidth={2}
                          />
                        )}
                        <Legend
                          wrapperStyle={{ fontSize: 11 }}
                          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={buildBarData(receiving, partnerReceiving)}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 56, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                        <XAxis type="number" domain={[0, 10]} tick={false} axisLine={false} />
                        <YAxis type="category" dataKey="subject" width={52} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<BarChartTooltip />} cursor={{ fill: "rgba(167,139,250,0.06)", radius: 8 }} />
                        <Bar
                          dataKey="you"
                          name="You"
                          fill="#a78bfa"
                          fillOpacity={0.9}
                          radius={[0, 6, 6, 0]}
                          maxBarSize={28}
                          animationDuration={400}
                          animationEasing="ease-out"
                          activeBar={barActiveBarYou}
                        />
                        {hasPartner && partnerReceiving && (
                          <Bar
                            dataKey="partner"
                            name="Partner"
                            fill="#c4b5fd"
                            fillOpacity={0.8}
                            radius={[0, 6, 6, 0]}
                            maxBarSize={28}
                            animationDuration={400}
                            animationEasing="ease-out"
                            activeBar={barActiveBarPartner}
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Digital Garden (large) */}
          <motion.div variants={cardItem} className="bento-cell col-span-2 row-span-2">
          <Card className="card-hover glass h-full border-purple-500/10">
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

          {/* Solo AI Insights — for users without a partner */}
          {!hasPartner && hasAssessment && (
            <motion.div variants={cardItem} className="bento-cell col-span-4">
              <Card className="card-hover glass relative overflow-hidden border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent shadow-lg shadow-violet-500/10">
                <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-3xl" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2 font-serif text-xl">
                    <span className="rounded-lg bg-violet-500/15 p-1.5">
                      <Sparkles className="h-5 w-5 text-violet-400" />
                    </span>
                    Insights for you
                  </CardTitle>
                  <CardDescription>
                    Send your love language preferences to AI and get a personal prescription — how to grow in self-love and be ready to love others.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  {soloInsightLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-24 w-full rounded-xl" />
                      <Skeleton className="h-28 w-full rounded-xl" />
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                      </div>
                    </div>
                  ) : soloInsight ? (
                    <div className="space-y-6">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {soloInsight.relationshipPrescription}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {soloInsight.threeDates.map((d, i) => (
                          <div
                            key={i}
                            className="rounded-xl border border-violet-500/15 bg-muted/40 p-4 transition-colors hover:border-violet-500/25 hover:bg-violet-500/5"
                          >
                            <div className="font-medium text-foreground">{d.title}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{d.why}</p>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-violet-400/30 text-violet-200 hover:bg-violet-500/10"
                        onClick={async () => {
                          setSoloInsightLoading(true);
                          try {
                            const result = await getSoloInsight(giving, receiving);
                            setSoloInsight(result);
                          } finally {
                            setSoloInsightLoading(false);
                          }
                        }}
                      >
                        Regenerate insight
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-purple-500 hover:shadow-violet-500/30"
                      onClick={async () => {
                        setSoloInsightLoading(true);
                        try {
                          const result = await getSoloInsight(giving, receiving);
                          setSoloInsight(result);
                        } finally {
                          setSoloInsightLoading(false);
                        }
                      }}
                    >
                      Get my insights
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Heatmap */}
          <motion.div variants={cardItem} className="bento-cell col-span-2">
          <Card className="card-hover glass h-full border-purple-500/10">
            <CardHeader>
              <CardTitle>Intensity grid</CardTitle>
              <CardDescription>How strongly you give (top row) and need to receive (bottom row) each language — 1 (low) to 10 (high)</CardDescription>
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
            <motion.div variants={cardItem} className="bento-cell col-span-4">
            <Card className="card-hover glass border-purple-500/10">
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
          <motion.div variants={cardItem} className="bento-cell col-span-2">
          <Card className="card-hover glass h-full border-purple-500/10">
            <CardHeader>
              <CardTitle>Connect with your partner</CardTitle>
              <CardDescription>
                {hasPartner
                  ? "You’re linked. Only you and your partner can see each other — a private space for two."
                  : "Send an invite using your partner’s username. Only two people can be linked at a time. They’ll see the request and can accept to link up."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PartnerInviteCard
                hasPartner={hasPartner}
                partnerRequests={partnerRequests}
                myUsername={myUsername}
                onAccept={() => window.location.reload()}
                onDecline={() => window.location.reload()}
                onSent={() => window.location.reload()}
              />
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function PartnerInviteCard({
  hasPartner,
  partnerRequests,
  myUsername,
  onAccept,
  onDecline,
  onSent,
}: {
  hasPartner: boolean;
  partnerRequests: { sent: PartnerRequestSent[]; received: PartnerRequestReceived[] };
  myUsername: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onSent: () => void;
}) {
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const handleSend = async () => {
    const uname = username.trim();
    if (!uname) return;
    setSending(true);
    setError(null);
    const res = await fetch("/api/partner-invite/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: uname }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) {
      setUsername("");
      onSent();
    } else {
      setError(data.error || "Could not send invite.");
    }
  };

  const handleAccept = async (requestId: string) => {
    setAcceptingId(requestId);
    const res = await fetch("/api/partner-invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId }),
    });
    setAcceptingId(null);
    if (res.ok) onAccept();
  };

  const handleDecline = async (requestId: string) => {
    setDecliningId(requestId);
    await fetch("/api/partner-invite/decline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: requestId }),
    });
    setDecliningId(null);
    onDecline();
  };

  return (
    <div className="space-y-5">
      {myUsername && (
        <p className="text-sm text-muted-foreground">
          Your username: <span className="font-medium text-foreground">@{myUsername}</span> — share it so your partner can send you an invite.
        </p>
      )}
      {hasPartner ? (
        <p className="text-sm text-muted-foreground">You’re linked with your partner. Compare your love languages above.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="partner-username" className="mb-1 block text-sm font-medium text-foreground">
                Partner’s username
              </label>
              <input
                id="partner-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                placeholder="Enter their username"
                className={cn(
                  "w-full rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all duration-200",
                  "focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400/20 hover:border-violet-400/20"
                )}
              />
            </div>
            <Button onClick={handleSend} disabled={sending || !username.trim()}>
              {sending ? "Sending…" : "Send invite"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}

          {partnerRequests.received.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Invite requests</h4>
              <ul className="space-y-2">
                {partnerRequests.received.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-muted/30 px-3 py-2">
                    <span className="text-sm">
                      <span className="font-medium text-foreground">@{r.from_username ?? "?"}</span>
                      {r.from_name && <span className="text-muted-foreground"> · {r.from_name}</span>}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDecline(r.id)} disabled={decliningId === r.id}>
                        {decliningId === r.id ? "…" : "Decline"}
                      </Button>
                      <Button size="sm" onClick={() => handleAccept(r.id)} disabled={acceptingId === r.id}>
                        {acceptingId === r.id ? "…" : "Accept"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {partnerRequests.sent.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-foreground">Pending invites (sent)</h4>
              <ul className="space-y-1">
                {partnerRequests.sent.map((r) => (
                  <li key={r.id} className="text-sm text-muted-foreground">
                    @{r.to_username ?? "?"}
                    {r.to_name && ` · ${r.to_name}`} — waiting
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
