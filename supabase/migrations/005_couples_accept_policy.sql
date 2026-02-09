-- Allow the receiver of a partner invite to insert the couple row when accepting.
-- Previously only the inviter (profile_a_id = auth.uid()) could insert, so the Accept
-- button did nothing because the API's INSERT was blocked by RLS.

CREATE POLICY "Users can insert couple (as acceptor)" ON public.couples
  FOR INSERT
  WITH CHECK (
    profile_b_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.partner_requests pr
      WHERE pr.from_user_id = profile_a_id
        AND pr.to_user_id = auth.uid()
        AND pr.status = 'accepted'
    )
  );
