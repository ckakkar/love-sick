"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to partner_notifications for the current user. On INSERT or UPDATE,
 * calls refetch so the notification list and unread count stay in sync in real time.
 */
export function useRealtimeNotifications(refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const supabase = createClient();

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelledRef.current || !user?.id) return;

      const channel = supabase.channel(`notifications:${user.id}`);
      channelRef.current = channel;
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "partner_notifications",
            filter: `to_user_id=eq.${user.id}`,
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
            table: "partner_notifications",
            filter: `to_user_id=eq.${user.id}`,
          },
          () => {
            refetchRef.current();
          }
        )
        .subscribe();
    };

    setup();
    return () => {
      cancelledRef.current = true;
      const ch = channelRef.current;
      channelRef.current = null;
      if (ch) supabase.removeChannel(ch);
    };
  }, []);
}
