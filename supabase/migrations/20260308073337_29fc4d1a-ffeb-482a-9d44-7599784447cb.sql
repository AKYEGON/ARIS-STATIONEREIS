
-- Create product_variants table
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL, -- e.g., 'Size', 'Color', 'Pack Size', custom
  variant_value TEXT NOT NULL, -- e.g., 'A4', 'Blue', 'Pack of 10'
  price NUMERIC NOT NULL,
  cost_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  sku TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Everyone can view active variants"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update variants"
  ON public.product_variants FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete variants"
  ON public.product_variants FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
