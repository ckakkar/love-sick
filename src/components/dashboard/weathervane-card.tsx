"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, MapPin } from "lucide-react";

export type WeathervaneData = {
  yourLocation?: string;
  yourTemp?: number;
  yourCondition?: string;
  partnerLocation?: string;
  partnerTemp?: number;
  partnerCondition?: string;
};

export function WeathervaneCard({
  hasPartner,
  data,
}: {
  hasPartner: boolean;
  data?: WeathervaneData | null;
}) {
  const yourTemp = data?.yourTemp ?? 72;
  const yourCondition = data?.yourCondition ?? "Sunny";
  const partnerTemp = data?.partnerTemp ?? 68;
  const partnerCondition = data?.partnerCondition ?? "Partly cloudy";
  const yourLocation = data?.yourLocation ?? "Your location";
  const partnerLocation = data?.partnerLocation ?? "Their location";

  return (
    <Card className="card-hover glass h-full border-border/60 border-violet-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-serif text-base tracking-tight">
          <Cloud className="h-4 w-4 text-violet-400" />
          The Weathervane
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-400/80" />
          <span className="truncate text-xs text-muted-foreground">{yourLocation}</span>
          <span className="ml-auto text-sm font-semibold text-foreground">{yourTemp}°</span>
        </div>
        {hasPartner && (
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#c4b5fd]" />
            <span className="truncate text-xs text-muted-foreground">{partnerLocation}</span>
            <span className="ml-auto text-sm font-semibold text-foreground">{partnerTemp}°</span>
          </div>
        )}
        <p className="text-[10px] leading-relaxed text-muted-foreground/80">
          {hasPartner ? "Your weather vs your partner’s — plan calls or visits." : "Add a partner to compare locations."}
        </p>
      </CardContent>
    </Card>
  );
}
