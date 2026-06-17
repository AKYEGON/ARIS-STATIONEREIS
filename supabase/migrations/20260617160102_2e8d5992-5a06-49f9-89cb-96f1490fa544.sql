DROP POLICY IF EXISTS "Public read by token" ON public.review_requests;

CREATE POLICY "Public read by token"
  ON public.review_requests
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('pending','sent','submitted'));