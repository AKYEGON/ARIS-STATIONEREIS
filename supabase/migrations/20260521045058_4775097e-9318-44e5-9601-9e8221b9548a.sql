
CREATE OR REPLACE FUNCTION public.adjust_variant_stock(
  p_variant_id uuid,
  p_change integer,
  p_reason text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id uuid;
  v_variant_label text;
BEGIN
  SELECT product_id, variant_type || ': ' || variant_value
    INTO v_product_id, v_variant_label
  FROM public.product_variants
  WHERE id = p_variant_id;

  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Variant not found';
  END IF;

  UPDATE public.product_variants
  SET stock = COALESCE(stock, 0) + p_change
  WHERE id = p_variant_id;

  INSERT INTO public.stock_movements (product_id, change, reason, notes)
  VALUES (
    v_product_id,
    p_change,
    p_reason,
    COALESCE('[Variant ' || v_variant_label || '] ', '') || COALESCE(p_notes, '')
  );
END;
$$;
