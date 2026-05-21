
-- Add missing foreign keys so Supabase nested queries can join products
-- onto course bundles (fixes auto-collage on the Deals page and elsewhere).

ALTER TABLE public.course_bundles
  ADD CONSTRAINT course_bundles_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD CONSTRAINT course_bundles_course_year_id_fkey
    FOREIGN KEY (course_year_id) REFERENCES public.course_years(id) ON DELETE CASCADE;

ALTER TABLE public.course_bundle_items
  ADD CONSTRAINT course_bundle_items_course_bundle_id_fkey
    FOREIGN KEY (course_bundle_id) REFERENCES public.course_bundles(id) ON DELETE CASCADE,
  ADD CONSTRAINT course_bundle_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_course_bundles_course_id ON public.course_bundles(course_id);
CREATE INDEX IF NOT EXISTS idx_course_bundles_year_id ON public.course_bundles(course_year_id);
CREATE INDEX IF NOT EXISTS idx_course_bundle_items_bundle_id ON public.course_bundle_items(course_bundle_id);
CREATE INDEX IF NOT EXISTS idx_course_bundle_items_product_id ON public.course_bundle_items(product_id);
