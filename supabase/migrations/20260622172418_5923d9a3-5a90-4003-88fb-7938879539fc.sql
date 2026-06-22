
CREATE OR REPLACE FUNCTION public.add_store_credit(p_phone text, p_amount numeric, p_source store_credit_source, p_reference_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_new_balance numeric; v_id uuid;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorised to add store credit';
  END IF;

  v_new_balance := public.get_store_credit_balance(p_phone) + p_amount;
  INSERT INTO public.store_credit_ledger(customer_phone, amount, source, reference_id, notes, balance_after)
  VALUES (p_phone, p_amount, p_source, p_reference_id, p_notes, v_new_balance)
  RETURNING id INTO v_id;
  RETURN v_id;
END;$function$;

DROP POLICY IF EXISTS "Public read by token" ON public.review_requests;
REVOKE SELECT ON public.review_requests FROM anon;

CREATE OR REPLACE FUNCTION public.get_review_request_by_token(p_token uuid)
RETURNS TABLE(
  id uuid,
  status text,
  product_id uuid,
  order_id uuid,
  customer_name text,
  product_name text,
  product_image text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.id, r.status, r.product_id, r.order_id, r.customer_name,
         p.name, p.image
    FROM public.review_requests r
    LEFT JOIN public.products p ON p.id = r.product_id
   WHERE r.token = p_token
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_review_request_by_token(uuid) TO anon, authenticated;
