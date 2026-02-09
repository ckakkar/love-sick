"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export type TimeDifferenceData = {
  partnerTimezone?: string; // IANA e.g. "America/New_York"
  partnerLabel?: string;    // e.g. "Her time"
};

export function TimeDifferenceCard({
  hasPartner,
  data,
}: {
  hasPartner: boolean;
  data?: TimeDifferenceData | null;
}) {
  const [partnerTime, setPartnerTime] = useState<string>("—:—");
  const tz = data?.partnerTimezone ?? "UTC";
  const label = data?.partnerLabel ?? "Their time";

  useEffect(() => {
    if (!hasPartner) return;
    const format = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const tick = () => setPartnerTime(format.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hasPartner, tz]);

  return (
    <Card className="card-hover glass h-full border-border/60 border-violet-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-serif text-base tracking-tight">
          <Clock className="h-4 w-4 text-violet-400" />
          The Time Difference
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasPartner ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/30 py-4">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
            <span className="mt-1 font-mono text-2xl font-medium tabular-nums text-foreground">{partnerTime}</span>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Connect with a partner to see their local time and plan better.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
