-- Profiles: add username (unique), full_name, age, sex for onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS age INT CHECK (age IS NULL OR (age >= 1 AND age <= 120)),
  ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IS NULL OR sex IN ('male', 'female', 'other', 'prefer_not_to_say'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username)) WHERE username IS NOT NULL;

-- Partner requests: invite by username (friend-request style)
CREATE TABLE IF NOT EXISTS public.partner_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_invite CHECK (from_user_id != to_user_id),
  CONSTRAINT unique_pair_pending UNIQUE (from_user_id, to_user_id)
);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read requests they sent" ON public.partner_requests
  FOR SELECT USING (auth.uid() = from_user_id);
CREATE POLICY "Users can read requests they received" ON public.partner_requests
  FOR SELECT USING (auth.uid() = to_user_id);
CREATE POLICY "Users can insert requests (as sender)" ON public.partner_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Receivers can update request (accept/reject)" ON public.partner_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

CREATE INDEX IF NOT EXISTS idx_partner_requests_to_status ON public.partner_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_requests_from ON public.partner_requests(from_user_id);

-- Lookup user id by username (for partner invite); avoids exposing all profiles.
CREATE OR REPLACE FUNCTION public.get_user_id_by_username(uname TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE LOWER(TRIM(username)) = LOWER(TRIM(uname)) LIMIT 1;
$$;

-- Return partner requests with usernames (for list API without exposing full profiles)
CREATE OR REPLACE FUNCTION public.get_partner_requests_with_usernames(uid UUID)
RETURNS TABLE (
  direction TEXT,
  request_id UUID,
  other_user_id UUID,
  other_username TEXT,
  other_name TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'sent'::TEXT, pr.id, pr.to_user_id, p.username, p.full_name, pr.status, pr.created_at
  FROM partner_requests pr
  JOIN profiles p ON p.id = pr.to_user_id
  WHERE pr.from_user_id = uid AND pr.status = 'pending'
  UNION ALL
  SELECT 'received'::TEXT, pr.id, pr.from_user_id, p.username, p.full_name, pr.status, pr.created_at
  FROM partner_requests pr
  JOIN profiles p ON p.id = pr.from_user_id
  WHERE pr.to_user_id = uid AND pr.status = 'pending';
$$;

COMMENT ON COLUMN public.profiles.username IS 'Unique handle for partner invites; set during onboarding.';
COMMENT ON TABLE public.partner_requests IS 'Friend-request style partner linking; accepting creates a couple.';
