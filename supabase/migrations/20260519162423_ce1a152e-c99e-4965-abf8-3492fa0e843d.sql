
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS sale_ends_at timestamptz;

CREATE TABLE IF NOT EXISTS public.bogo_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  product_id uuid NOT NULL,
  buy_quantity integer NOT NULL DEFAULT 2 CHECK (buy_quantity >= 1),
  get_quantity integer NOT NULL DEFAULT 1 CHECK (get_quantity >= 1),
  free_product_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bogo_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active BOGO offers viewable by everyone" ON public.bogo_offers;
CREATE POLICY "Active BOGO offers viewable by everyone"
  ON public.bogo_offers FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert BOGO offers" ON public.bogo_offers;
CREATE POLICY "Admins insert BOGO offers"
  ON public.bogo_offers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update BOGO offers" ON public.bogo_offers;
CREATE POLICY "Admins update BOGO offers"
  ON public.bogo_offers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete BOGO offers" ON public.bogo_offers;
CREATE POLICY "Admins delete BOGO offers"
  ON public.bogo_offers FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_bogo_offers_updated_at ON public.bogo_offers;
CREATE TRIGGER trg_bogo_offers_updated_at
  BEFORE UPDATE ON public.bogo_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
