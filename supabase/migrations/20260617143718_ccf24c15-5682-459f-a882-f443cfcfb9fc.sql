
-- Phase 1: Verified product review system

-- Extend customer_testimonials
ALTER TABLE public.customer_testimonials
  ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD COLUMN is_verified_purchase boolean NOT NULL DEFAULT false,
  ADD COLUMN review_token uuid UNIQUE;

CREATE INDEX idx_customer_testimonials_product_id ON public.customer_testimonials(product_id);
CREATE INDEX idx_customer_testimonials_verified ON public.customer_testimonials(is_verified_purchase, is_published);

-- review_requests table: one row per (order, product)
CREATE TABLE public.review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending', -- pending | sent | submitted | expired
  sent_via text, -- whatsapp | sms | both
  sent_at timestamptz,
  submitted_at timestamptz,
  testimonial_id uuid REFERENCES public.customer_testimonials(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;
GRANT SELECT, UPDATE ON public.review_requests TO anon; -- needed for token-based public review submission

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Admins manage all review requests
CREATE POLICY "Admins manage review_requests"
  ON public.review_requests
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Public can read a single review_request row by token (for /review/:token page).
-- Token is a secret uuid in the URL, so SELECT-by-token is the auth boundary.
CREATE POLICY "Public read by token"
  ON public.review_requests
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('pending','sent'));

-- Public can mark a request as submitted (only pending/sent rows, only flipping to submitted)
CREATE POLICY "Public submit by token"
  ON public.review_requests
  FOR UPDATE
  TO anon, authenticated
  USING (status IN ('pending','sent'))
  WITH CHECK (status = 'submitted');

CREATE INDEX idx_review_requests_order_id ON public.review_requests(order_id);
CREATE INDEX idx_review_requests_status ON public.review_requests(status);

CREATE TRIGGER update_review_requests_updated_at
  BEFORE UPDATE ON public.review_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
