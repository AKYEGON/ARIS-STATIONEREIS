ALTER TABLE public.school_list_submissions
  ADD COLUMN IF NOT EXISTS quote_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS quote_total numeric,
  ADD COLUMN IF NOT EXISTS quote_discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;