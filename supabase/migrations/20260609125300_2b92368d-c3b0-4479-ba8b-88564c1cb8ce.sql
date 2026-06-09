
-- 1. Add admin check to adjust_stock
CREATE OR REPLACE FUNCTION public.adjust_stock(p_product_id uuid, p_change integer, p_reason text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.products
  SET stock = stock + p_change
  WHERE id = p_product_id;

  INSERT INTO public.stock_movements (product_id, change, reason, notes)
  VALUES (p_product_id, p_change, p_reason, p_notes);
END;
$function$;

-- 2. Add admin check to adjust_variant_stock
CREATE OR REPLACE FUNCTION public.adjust_variant_stock(p_variant_id uuid, p_change integer, p_reason text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product_id uuid;
  v_variant_label text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

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
$function$;

-- 3. Tighten order_items INSERT policy
DROP POLICY IF EXISTS "Allow all users to insert order items" ON public.order_items;

CREATE POLICY "Staff can insert order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'employee'::app_role)
);
