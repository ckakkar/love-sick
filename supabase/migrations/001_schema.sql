-- Love Sick: Relationship Intelligence Platform
-- Run this in Supabase SQL Editor to create the schema.

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles: 1:1 with auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Couples: links two profiles; invite_code for partner linking
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  anniversary_date DATE,
  invite_code TEXT UNIQUE,
  invited_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT different_profiles CHECK (profile_a_id != profile_b_id OR profile_b_id IS NULL)
);

-- Assessments: raw giving/receiving scores per user
-- giving_scores / receiving_scores: { words: number, service: number, gifts: number, time: number, touch: number } 1-10
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  giving_scores JSONB NOT NULL DEFAULT '{}',
  receiving_scores JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invite codes: one-time use codes for partner linking (optional; can also store on couples)
CREATE TABLE IF NOT EXISTS public.invite_codes (
  code TEXT PRIMARY KEY,
  created_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  used_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Allow reading partner profiles when in same couple
CREATE POLICY "Users can read partner profile" ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT profile_b_id FROM public.couples WHERE profile_a_id = auth.uid() AND profile_b_id IS NOT NULL
      UNION
      SELECT profile_a_id FROM public.couples WHERE profile_b_id = auth.uid()
    )
  );

-- Couples: participants can read/update their couple
CREATE POLICY "Users can read own couples" ON public.couples FOR SELECT
  USING (profile_a_id = auth.uid() OR profile_b_id = auth.uid());
CREATE POLICY "Users can insert couple (as inviter)" ON public.couples FOR INSERT
  WITH CHECK (profile_a_id = auth.uid());
CREATE POLICY "Users can update own couple" ON public.couples FOR UPDATE
  USING (profile_a_id = auth.uid() OR profile_b_id = auth.uid());

-- Assessments: users can CRUD own
CREATE POLICY "Users can read own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON public.assessments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assessments" ON public.assessments FOR DELETE USING (auth.uid() = user_id);
-- Partners can read each other's assessments (for dashboard overlay)
CREATE POLICY "Partners can read partner assessments" ON public.assessments FOR SELECT
  USING (
    user_id IN (
      SELECT profile_b_id FROM public.couples WHERE profile_a_id = auth.uid() AND profile_b_id IS NOT NULL
      UNION
      SELECT profile_a_id FROM public.couples WHERE profile_b_id = auth.uid()
    )
  );

-- Invite codes: creator can read; anyone with code can read to validate
CREATE POLICY "Creator can read own codes" ON public.invite_codes FOR SELECT USING (created_by_id = auth.uid());
CREATE POLICY "Creator can insert codes" ON public.invite_codes FOR INSERT WITH CHECK (created_by_id = auth.uid());
CREATE POLICY "Creator can update (mark used)" ON public.invite_codes FOR UPDATE USING (created_by_id = auth.uid());

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_couples_profile_a ON public.couples(profile_a_id);
CREATE INDEX IF NOT EXISTS idx_couples_profile_b ON public.couples(profile_b_id);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON public.couples(invite_code);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments(user_id, created_at DESC);
