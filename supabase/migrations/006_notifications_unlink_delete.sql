-- Notifications: unlink reason (sent to partner) and partner-left-app (when account deleted)
CREATE TABLE IF NOT EXISTS public.partner_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('unlink_reason', 'partner_left_app')),
  payload JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_notifications_to_user_created
  ON public.partner_notifications(to_user_id, created_at DESC);

ALTER TABLE public.partner_notifications ENABLE ROW LEVEL SECURITY;

-- Recipients can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.partner_notifications FOR SELECT
  USING (to_user_id = auth.uid());

-- Sender can insert a notification where they are the from_user (unlink or pre-delete)
CREATE POLICY "Users can insert notifications as sender"
  ON public.partner_notifications FOR INSERT
  WITH CHECK (from_user_id = auth.uid());

-- Recipients can update read_at (mark as read)
CREATE POLICY "Users can update own notifications read_at"
  ON public.partner_notifications FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());

COMMENT ON TABLE public.partner_notifications IS 'Unlink reason sent to partner; partner_left_app when user deletes account.';
