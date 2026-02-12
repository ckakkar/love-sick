-- Enable Realtime for tables used by live updates (notifications, deep cut answers).
-- Required for useRealtimeNotifications and useRealtimeDeepCuts. Run once; if a table
-- is already in the publication, skip that line or use Dashboard → Database → Replication.
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deep_cut_answers;
