"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/** Presence payload we track; must include user_id for partner detection. */
type PresencePayload = { user_id: string };

function collectUserIdsFromPresenceState(state: Record<string, unknown[]>): Set<string> {
  const userIds = new Set<string>();
  Object.values(state).forEach((presences) => {
    if (!Array.isArray(presences)) return;
    presences.forEach((p) => {
      const payload = p as Record<string, unknown>;
      const id = payload?.user_id;
      if (typeof id === "string" && id) userIds.add(id);
    });
  });
  return userIds;
}

export function usePartnerPresence(roomId: string | null, partnerId: string | null) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!roomId || !partnerId) {
      setPartnerOnline(false);
      return;
    }

    const supabase = createClient();
    const channelName = `room:${roomId}`;
    const channel = supabase.channel(channelName);

    channelRef.current = channel;

    const updatePartnerOnline = () => {
      const state = channel.presenceState() as Record<string, PresencePayload[]>;
      const userIds = collectUserIdsFromPresenceState(state as Record<string, unknown[]>);
      setPartnerOnline(userIds.has(partnerId));
    };

    channel
      .on("presence", { event: "sync" }, updatePartnerOnline)
      .on("presence", { event: "join" }, updatePartnerOnline)
      .on("presence", { event: "leave" }, updatePartnerOnline)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.id) {
            try {
              await channel.track({ user_id: user.id });
            } catch {
              // track can fail on reconnect; sync will still reflect state
            }
          }
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setPartnerOnline(false);
        }
      });

    return () => {
      channelRef.current = null;
      setPartnerOnline(false);
      channel
        .untrack()
        .catch(() => {})
        .then(() => {
          supabase.removeChannel(channel);
        });
    };
  }, [roomId, partnerId]);

  return partnerOnline;
}
