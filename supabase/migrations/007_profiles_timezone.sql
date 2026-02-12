-- Profiles: timezone (IANA e.g. America/New_York) for Time Difference card
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT;

COMMENT ON COLUMN public.profiles.timezone IS 'IANA timezone for local time display and partner time difference';
