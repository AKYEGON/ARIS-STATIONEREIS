CREATE OR REPLACE FUNCTION public.release_reservation(p_reservation_id uuid, p_issue_credit boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_r public.book_reservations%ROWTYPE;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT * INTO v_r FROM public.book_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;
  IF v_r.status IN ('released','refunded','collected','delivered') THEN RETURN; END IF;

  UPDATE public.books SET slots_reserved = GREATEST(0, slots_reserved - 1) WHERE id = v_r.book_id;

  IF p_issue_credit AND v_r.amount_paid > 0 AND NOT v_r.store_credit_issued THEN
    PERFORM public.add_store_credit(
      v_r.customer_phone, v_r.amount_paid, 'book_release', v_r.id,
      'Auto-release of reservation'
    );
    UPDATE public.book_reservations SET store_credit_issued = true WHERE id = v_r.id;
  END IF;

  UPDATE public.book_reservations SET status = 'released' WHERE id = v_r.id;
END;$function$;

-- Ensure manager role can execute book management RPCs and modify books/genres
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid, boolean) TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.book_genres TO authenticated;