"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to deep_cut_answers for the given couple. On INSERT or UPDATE,
 * calls refetch so the question list updates in real time when the partner answers.
 */
export function useRealtimeDeepCuts(coupleId: string | null, refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();
    const channel = supabase.channel(`deep-cuts:${coupleId}`);
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deep_cut_answers",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          refetchRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deep_cut_answers",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          refetchRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);
}
