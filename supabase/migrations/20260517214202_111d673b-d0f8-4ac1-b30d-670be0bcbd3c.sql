-- Course Years
CREATE TABLE public.course_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  label text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_years_course_id ON public.course_years(course_id);

ALTER TABLE public.course_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course years" ON public.course_years FOR SELECT USING (true);
CREATE POLICY "Admins insert course years" ON public.course_years FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update course years" ON public.course_years FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete course years" ON public.course_years FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Course Product <-> Year (m2m). Empty rows = "all years".
CREATE TABLE public.course_product_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_product_id uuid NOT NULL,
  course_year_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_product_id, course_year_id)
);
CREATE INDEX idx_cpy_course_product ON public.course_product_years(course_product_id);
CREATE INDEX idx_cpy_course_year ON public.course_product_years(course_year_id);

ALTER TABLE public.course_product_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course product years" ON public.course_product_years FOR SELECT USING (true);
CREATE POLICY "Admins insert course product years" ON public.course_product_years FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete course product years" ON public.course_product_years FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Course Bundles (separate from homepage bundles)
CREATE TABLE public.course_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  course_year_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  image text NOT NULL,
  bundle_price numeric NOT NULL,
  original_total_price numeric NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_bundles_course ON public.course_bundles(course_id);
CREATE INDEX idx_course_bundles_year ON public.course_bundles(course_year_id);

ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view active course bundles" ON public.course_bundles FOR SELECT USING ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert course bundles" ON public.course_bundles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update course bundles" ON public.course_bundles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete course bundles" ON public.course_bundles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_course_bundles_updated_at BEFORE UPDATE ON public.course_bundles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Course Bundle Items
CREATE TABLE public.course_bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_bundle_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_bundle_items_bundle ON public.course_bundle_items(course_bundle_id);

ALTER TABLE public.course_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view course bundle items" ON public.course_bundle_items FOR SELECT USING (true);
CREATE POLICY "Admins insert course bundle items" ON public.course_bundle_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update course bundle items" ON public.course_bundle_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete course bundle items" ON public.course_bundle_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));