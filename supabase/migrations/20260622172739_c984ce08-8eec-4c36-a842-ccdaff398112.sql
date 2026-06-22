
-- State machine: define allowed transitions for reservations
CREATE OR REPLACE FUNCTION public.update_reservation_status(p_reservation_id uuid, p_status book_reservation_status, p_notes text DEFAULT NULL::text)
 RETURNS book_reservations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_r public.book_reservations%ROWTYPE;
  v_allowed book_reservation_status[];
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'employee'::app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT * INTO v_r FROM public.book_reservations
   WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;

  -- Allowed transitions per current status (admin override stays open via direct DB)
  v_allowed := CASE v_r.status
    WHEN 'pending_payment' THEN ARRAY['reserved','balance_paid','cancelled','released']::book_reservation_status[]
    WHEN 'reserved'        THEN ARRAY['balance_paid','collected','delivered','cancelled','released']::book_reservation_status[]
    WHEN 'balance_paid'    THEN ARRAY['collected','delivered','cancelled','released']::book_reservation_status[]
    WHEN 'collected'       THEN ARRAY['delivered','refunded']::book_reservation_status[]
    WHEN 'delivered'       THEN ARRAY['refunded']::book_reservation_status[]
    WHEN 'released'        THEN ARRAY['refunded']::book_reservation_status[]
    WHEN 'refunded'        THEN ARRAY[]::book_reservation_status[]
    WHEN 'cancelled'       THEN ARRAY['refunded']::book_reservation_status[]
    ELSE ARRAY[]::book_reservation_status[]
  END;

  IF p_status <> v_r.status AND NOT (p_status = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Invalid transition from % to %', v_r.status, p_status;
  END IF;

  UPDATE public.book_reservations
     SET status = p_status,
         notes = COALESCE(p_notes, notes)
   WHERE id = p_reservation_id
   RETURNING * INTO v_r;
  RETURN v_r;
END;$function$;

-- Negative-amount guard + keep audit row
CREATE OR REPLACE FUNCTION public.record_book_payment(p_reservation_id uuid, p_kind book_payment_kind, p_amount numeric, p_mpesa_receipt text DEFAULT NULL::text, p_mpesa_phone text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS book_reservations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_r public.book_reservations%ROWTYPE;
  v_book public.books%ROWTYPE;
  v_new_paid numeric;
  v_new_balance numeric;
  v_new_status book_reservation_status;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'employee'::app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Amount required';
  END IF;

  -- Refunds must be explicitly typed; positive amounts only otherwise.
  IF p_amount < 0 AND p_kind <> 'refund' THEN
    RAISE EXCEPTION 'Negative amounts only allowed for refund payments';
  END IF;
  IF p_amount > 0 AND p_kind = 'refund' THEN
    RAISE EXCEPTION 'Refund amount must be negative';
  END IF;

  SELECT * INTO v_r FROM public.book_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;

  SELECT * INTO v_book FROM public.books WHERE id = v_r.book_id;

  INSERT INTO public.book_payments(reservation_id, kind, amount, mpesa_receipt, mpesa_phone, status)
  VALUES (p_reservation_id, p_kind, p_amount, p_mpesa_receipt, p_mpesa_phone, 'success');

  v_new_paid := GREATEST(0, COALESCE(v_r.amount_paid, 0) + p_amount);
  v_new_balance := GREATEST(0, v_book.full_price - v_new_paid);

  v_new_status := v_r.status;
  IF v_r.status IN ('pending_payment','reserved','balance_paid') THEN
    IF v_new_paid >= v_book.full_price THEN
      v_new_status := 'balance_paid';
    ELSIF v_new_paid >= v_book.deposit_amount THEN
      v_new_status := 'reserved';
    ELSE
      v_new_status := 'pending_payment';
    END IF;
  END IF;

  UPDATE public.book_reservations
     SET amount_paid = v_new_paid,
         balance_due = v_new_balance,
         status = v_new_status,
         notes = COALESCE(p_notes, notes)
   WHERE id = p_reservation_id
   RETURNING * INTO v_r;

  RETURN v_r;
END;$function$;

-- Race fix: lock parent book row before decrementing slots_reserved
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

  -- Lock the book row to serialize slot decrements
  PERFORM 1 FROM public.books WHERE id = v_r.book_id FOR UPDATE;

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

-- Non-negative stock guards
ALTER TABLE public.products
  ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0) NOT VALID;
ALTER TABLE public.products VALIDATE CONSTRAINT products_stock_non_negative;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_stock_non_negative CHECK (stock IS NULL OR stock >= 0) NOT VALID;
ALTER TABLE public.product_variants VALIDATE CONSTRAINT product_variants_stock_non_negative;
