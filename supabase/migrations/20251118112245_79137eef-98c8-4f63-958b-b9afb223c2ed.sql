-- Fix security warning: Add search_path to calculate_product_profit function
CREATE OR REPLACE FUNCTION public.calculate_product_profit(product_id UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT price - COALESCE(cost_price, 0) FROM public.products WHERE id = product_id),
    0
  )
$$;