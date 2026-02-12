-- Check if a username is available (for onboarding validation).
-- Returns true if no other user has this username (case-insensitive); current user's own username counts as available.
CREATE OR REPLACE FUNCTION public.is_username_available(check_uid UUID, uname TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(TRIM(username)) = LOWER(TRIM(uname))
      AND id != check_uid
  );
$$;
