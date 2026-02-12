-- Prologues: allow users to update their own prologue (required for upsert on re-save)
CREATE POLICY "Users can update own prologues" ON public.prologues
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix prologues saved with wrong partner_id (accepter had partnerId = self before dashboard fix).
-- Rows where user_id = partner_id are invalid; set partner_id to actual partner (profile_a) for accepters.
UPDATE public.prologues p
SET partner_id = c.profile_a_id
FROM public.couples c
WHERE p.user_id = p.partner_id
  AND c.profile_b_id = p.user_id
  AND c.status = 'active';
