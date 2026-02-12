-- Question Exchange (Deep Cuts): progressive prompts, private answers, simultaneous reveal

-- Global prompts (same for all couples); order_index controls progression
CREATE TABLE IF NOT EXISTS public.deep_cut_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt TEXT NOT NULL,
  stage_label TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0
);

-- One row per user per question per couple; partner sees answer only when both have answered
CREATE TABLE IF NOT EXISTS public.deep_cut_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.deep_cut_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, user_id, couple_id)
);

ALTER TABLE public.deep_cut_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_cut_answers ENABLE ROW LEVEL SECURITY;

-- Questions readable by all authenticated (for UI)
CREATE POLICY "Authenticated can read questions" ON public.deep_cut_questions
  FOR SELECT TO authenticated USING (true);

-- Answers: user can insert/update own; user can read own; read partner's only via API when both answered
CREATE POLICY "Users can insert own deep_cut_answers" ON public.deep_cut_answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deep_cut_answers" ON public.deep_cut_answers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read deep_cut_answers in their couples" ON public.deep_cut_answers
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.couples c
      WHERE c.id = couple_id
        AND (c.profile_a_id = auth.uid() OR c.profile_b_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_deep_cut_answers_question_couple ON public.deep_cut_answers(question_id, couple_id);
CREATE INDEX IF NOT EXISTS idx_deep_cut_answers_user_couple ON public.deep_cut_answers(user_id, couple_id);
CREATE INDEX IF NOT EXISTS idx_deep_cut_questions_order ON public.deep_cut_questions(order_index);

-- Seed progressive prompts (early → deeper); run only when empty
INSERT INTO public.deep_cut_questions (prompt, stage_label, order_index)
SELECT * FROM (VALUES
  ('What''s a childhood memory that shaped you?', 'Week 1', 1),
  ('What do you need most from me when I''m stressed?', 'Week 2', 2),
  ('What''s something you''re proud of that I might not know?', 'Month 1', 3),
  ('When did you first know you wanted to be with me?', 'Month 2', 4),
  ('What fear about us have you never said out loud?', 'Month 3', 5),
  ('What do you need to hear from me more often?', 'Month 4', 6),
  ('What''s one way we could fight better?', 'Month 5', 7),
  ('What does "home" mean to you when I''m in it?', 'Month 6', 8)
) AS v(prompt, stage_label, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.deep_cut_questions LIMIT 1);
