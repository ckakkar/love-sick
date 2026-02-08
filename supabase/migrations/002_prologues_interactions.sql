-- Phase 2: Prologues (unlock gate) + Interactions (e.g. digital_leaf)

-- Prologues: user writes 150 chars "why you chose this person" to unlock dashboard for that couple
CREATE TABLE IF NOT EXISTS public.prologues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, partner_id)
);

-- Interactions: e.g. "digital_leaf" sent to partner (for Pick a Leaf)
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'digital_leaf',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prologues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Prologues: user can insert/read own; partner can read (to know they're "unlocked" for UI)
CREATE POLICY "Users can read own prologues" ON public.prologues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read prologue where they are partner" ON public.prologues FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Users can insert own prologue" ON public.prologues FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Interactions: user can insert (sending); both can read (for toasts / activity)
CREATE POLICY "Users can insert own interactions" ON public.interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read interactions where they are sender or partner" ON public.interactions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE INDEX IF NOT EXISTS idx_prologues_user_partner ON public.prologues(user_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_interactions_partner_created ON public.interactions(partner_id, created_at DESC);
