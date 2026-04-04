
-- Create junction table for many-to-many product-category relationship
CREATE TABLE public.product_category_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id, category_id)
);

-- Enable RLS
ALTER TABLE public.product_category_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view category assignments"
ON public.product_category_assignments
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert category assignments"
ON public.product_category_assignments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete category assignments"
ON public.product_category_assignments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data: link products to categories by name match
INSERT INTO public.product_category_assignments (product_id, category_id)
SELECT p.id, pc.id
FROM public.products p
JOIN public.product_categories pc ON LOWER(TRIM(p.category)) = LOWER(TRIM(pc.name))
WHERE p.category IS NOT NULL AND p.category != ''
ON CONFLICT DO NOTHING;
