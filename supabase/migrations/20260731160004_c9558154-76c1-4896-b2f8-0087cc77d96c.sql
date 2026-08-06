ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image text,
  ADD COLUMN IF NOT EXISTS intro_copy text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text;

CREATE INDEX IF NOT EXISTS product_categories_parent_id_idx ON public.product_categories(parent_id);

INSERT INTO public.product_categories (name, slug, icon, display_order, is_active)
VALUES
  ('Course Equipment', 'course-equipment', 'Compass', 1, true),
  ('Stationery & Writing', 'stationery-writing', 'PenLine', 2, true),
  ('Art & Design', 'art-design', 'Palette', 3, true),
  ('Room & Living', 'room-living', 'Lamp', 6, false),
  ('Electronics', 'electronics', 'Laptop', 7, false),
  ('Printing', 'printing', 'Printer', 8, false)
ON CONFLICT DO NOTHING;

UPDATE public.product_categories SET display_order = 4, parent_id = NULL WHERE slug = 'office-supplies';
UPDATE public.product_categories SET display_order = 5, parent_id = NULL WHERE slug = 'gifts-accessories';

UPDATE public.product_categories c SET parent_id = p.id, display_order = v.ord
FROM (VALUES
  ('engineering-drawing','course-equipment',1),
  ('scientific-calculators','course-equipment',2),
  ('mathematics-equipments','course-equipment',3),
  ('exam-essentials','course-equipment',4),
  ('writing-instruments','stationery-writing',1),
  ('notebooks-books','stationery-writing',2),
  ('filing-organization','stationery-writing',3),
  ('general-stationery','stationery-writing',4),
  ('art-craft-supplies','art-design',1)
) AS v(child, parent, ord)
JOIN public.product_categories p ON p.slug = v.parent
WHERE c.slug = v.child;