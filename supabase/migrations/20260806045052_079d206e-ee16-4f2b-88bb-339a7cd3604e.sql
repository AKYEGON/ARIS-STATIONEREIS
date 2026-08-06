ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS backorder_eta_days integer;

ALTER TABLE public.products
  ADD CONSTRAINT products_stock_status_check CHECK (stock_status IN ('active','out_of_stock','backorder'));

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS stock_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS backorder_eta_days integer;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_stock_status_check CHECK (stock_status IN ('active','out_of_stock','backorder'));

CREATE TABLE IF NOT EXISTS public.restock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  contact text NOT NULL,
  contact_type text NOT NULL DEFAULT 'phone',
  customer_name text,
  status text NOT NULL DEFAULT 'pending',
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.restock_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restock_requests TO authenticated;
GRANT ALL ON public.restock_requests TO service_role;

ALTER TABLE public.restock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request a restock alert"
  ON public.restock_requests FOR INSERT TO anon, authenticated
  WITH CHECK (length(trim(contact)) >= 5 AND contact_type IN ('phone','email'));

CREATE POLICY "Staff can view restock requests"
  ON public.restock_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'employee'));

CREATE POLICY "Staff can update restock requests"
  ON public.restock_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

CREATE POLICY "Admins can delete restock requests"
  ON public.restock_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));