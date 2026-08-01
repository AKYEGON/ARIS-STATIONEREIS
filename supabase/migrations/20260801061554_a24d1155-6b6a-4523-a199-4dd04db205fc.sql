-- Hero slides (admin-managed homepage imagery)
CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  headline text,
  subheadline text,
  caption text,
  cta_label text,
  cta_link text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can view all hero slides"
  ON public.hero_slides FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can insert hero slides"
  ON public.hero_slides FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can update hero slides"
  ON public.hero_slides FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can delete hero slides"
  ON public.hero_slides FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER update_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Homepage "Popular right now" overrides
CREATE TABLE public.homepage_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'pin',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homepage_picks_kind_check CHECK (kind IN ('pin','exclude')),
  CONSTRAINT homepage_picks_unique UNIQUE (product_id, kind)
);

GRANT SELECT ON public.homepage_picks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_picks TO authenticated;
GRANT ALL ON public.homepage_picks TO service_role;

ALTER TABLE public.homepage_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view homepage picks"
  ON public.homepage_picks FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert homepage picks"
  ON public.homepage_picks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can update homepage picks"
  ON public.homepage_picks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can delete homepage picks"
  ON public.homepage_picks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER update_homepage_picks_updated_at
  BEFORE UPDATE ON public.homepage_picks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Real bestseller data from order history
CREATE OR REPLACE FUNCTION public.get_top_selling_products(p_days integer DEFAULT 30, p_limit integer DEFAULT 8)
RETURNS TABLE(product_id uuid, units_sold bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id AS product_id, SUM(oi.quantity)::bigint AS units_sold
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    JOIN public.products p ON lower(p.name) = lower(oi.product_name)
   WHERE o.created_at >= now() - (p_days || ' days')::interval
     AND lower(o.status) NOT IN ('cancelled','refunded')
     AND NOT EXISTS (
       SELECT 1 FROM public.homepage_picks hp
        WHERE hp.product_id = p.id AND hp.kind = 'exclude'
     )
   GROUP BY p.id
   ORDER BY units_sold DESC
   LIMIT GREATEST(p_limit, 0);
$$;

REVOKE ALL ON FUNCTION public.get_top_selling_products(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_selling_products(integer, integer) TO anon, authenticated, service_role;