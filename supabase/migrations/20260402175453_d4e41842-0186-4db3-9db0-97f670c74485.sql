
-- Create product_categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view active categories"
ON public.product_categories FOR SELECT
USING (true);

-- Admin write
CREATE POLICY "Admins can insert categories"
ON public.product_categories FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
ON public.product_categories FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.product_categories FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed categories
INSERT INTO public.product_categories (name, slug, icon, display_order) VALUES
  ('Engineering & Drawing', 'engineering-drawing', '📐', 1),
  ('Scientific Calculators', 'scientific-calculators', '🔢', 2),
  ('Writing Instruments', 'writing-instruments', '✏️', 3),
  ('Notebooks & Papers', 'notebooks-papers', '📓', 4),
  ('Filing & Organization', 'filing-organization', '📁', 5),
  ('Art & Craft Supplies', 'art-craft-supplies', '🎨', 6),
  ('Office Supplies', 'office-supplies', '📎', 7),
  ('Exam Essentials', 'exam-essentials', '📝', 8),
  ('Gifts & Accessories', 'gifts-accessories', '🎁', 9),
  ('General Stationery', 'general-stationery', '🗂️', 10);

-- Add columns to products
ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
