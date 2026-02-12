"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";

export function StreakCounterCard({
  hasPartner,
  daysLinked,
}: {
  hasPartner: boolean;
  daysLinked?: number | null;
}) {
  const days = daysLinked ?? 0;
  return (
    <Card className="card-hover glass h-full border-border/60 border-violet-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-serif text-base tracking-tight">
          <Heart className="h-4 w-4 text-violet-400" />
          Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {hasPartner ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/30 py-4">
            <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">{days}</span>
            <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {days === 1 ? "day linked" : "days linked"}
            </span>
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Once you’re linked, we’ll show how long you’ve been linked.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
