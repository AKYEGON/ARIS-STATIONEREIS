-- Add slug column to products for SEO-friendly URLs
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Slug generator: lowercase, replace non-alphanumeric with hyphens, trim hyphens
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  result := lower(input);
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  result := regexp_replace(result, '^-+|-+$', '', 'g');
  RETURN result;
END;
$$;

-- Backfill existing rows with unique slugs (append short id suffix to guarantee uniqueness)
UPDATE public.products
SET slug = public.slugify(name) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL OR slug = '';

-- Enforce NOT NULL + unique
ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_idx ON public.products(slug);

-- Trigger to auto-populate slug on insert/update when missing
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify(NEW.name) || '-' || substr(NEW.id::text, 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_product_slug ON public.products;
CREATE TRIGGER trg_set_product_slug
BEFORE INSERT OR UPDATE OF name, slug ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_product_slug();