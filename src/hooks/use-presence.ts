"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePartnerPresence(roomId: string | null, partnerId: string | null) {
  const [partnerOnline, setPartnerOnline] = useState(false);

  useEffect(() => {
    if (!roomId || !partnerId) {
      setPartnerOnline(false);
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: "" } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userIds = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as { user_id?: string }[]).forEach((p) => {
            if (p?.user_id) userIds.add(p.user_id);
          });
        });
        setPartnerOnline(userIds.has(partnerId));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await channel.track({ user_id: user.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setPartnerOnline(false);
    };
  }, [roomId, partnerId]);

  return partnerOnline;
}
