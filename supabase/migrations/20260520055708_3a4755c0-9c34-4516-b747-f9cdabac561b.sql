ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_common boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_is_common ON public.products(is_common) WHERE is_common = true;