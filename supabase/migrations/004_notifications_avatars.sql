-- Notification preferences and avatar storage

-- Profiles: notification settings (default on for best experience)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_partner_request BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_partner_online BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.notify_partner_request IS 'Notify when someone sends a partner invite';
COMMENT ON COLUMN public.profiles.notify_partner_online IS 'Notify when partner comes online (Heartbeat Sync)';

-- Create avatars bucket (Supabase storage). If this fails, create bucket in Dashboard: Storage → New bucket → id: avatars, public: true
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects so users can upload/update their own avatar
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
