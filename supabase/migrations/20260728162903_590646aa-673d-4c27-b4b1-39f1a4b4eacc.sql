UPDATE public.bogo_offers b
SET free_product_id = NULL
WHERE free_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = b.free_product_id);

DELETE FROM public.bogo_offers b
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = b.product_id);

ALTER TABLE public.bogo_offers
  ADD CONSTRAINT bogo_offers_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.bogo_offers
  ADD CONSTRAINT bogo_offers_free_product_id_fkey
  FOREIGN KEY (free_product_id) REFERENCES public.products(id) ON DELETE SET NULL;