"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

function useLocalTime(timezone: string | null): string {
  const [time, setTime] = useState("—:—");
  const tz = timezone ?? "UTC";

  useEffect(() => {
    try {
      const format = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const tick = () => setTime(format.format(new Date()));
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    } catch {
      setTime("—:—");
    }
  }, [tz]);

  return time;
}

export function TimeDifferenceCard({
  hasPartner,
  myTimezone,
  partnerTimezone,
}: {
  hasPartner: boolean;
  myTimezone?: string | null;
  partnerTimezone?: string | null;
}) {
  const myTime = useLocalTime(myTimezone ?? null);
  const partnerTime = useLocalTime(hasPartner ? partnerTimezone ?? null : null);

  return (
    <Card className="card-hover glass h-full border-border/60 border-violet-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-serif text-base tracking-tight">
          <Clock className="h-4 w-4 text-violet-400" />
          The Time Difference
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/30 py-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Your time</span>
            <span className="mt-0.5 font-mono text-xl font-medium tabular-nums text-foreground">{myTime}</span>
          </div>
          {hasPartner ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5 py-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Their time</span>
              <span className="mt-0.5 font-mono text-xl font-medium tabular-nums text-foreground">{partnerTime}</span>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Connect with a partner to see their local time and plan better.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
