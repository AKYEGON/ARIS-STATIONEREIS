
-- ============ RLS: let manager + employee view + work on reservations ============

-- Books: managers and employees can view
DROP POLICY IF EXISTS "Staff view books" ON public.books;
CREATE POLICY "Staff view books" ON public.books FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'employee'::app_role)
);

-- Genres: managers and employees can view
DROP POLICY IF EXISTS "Staff view genres" ON public.book_genres;
CREATE POLICY "Staff view genres" ON public.book_genres FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'employee'::app_role)
);

-- Reservations: staff can view
DROP POLICY IF EXISTS "Staff view reservations" ON public.book_reservations;
CREATE POLICY "Staff view reservations" ON public.book_reservations FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'employee'::app_role)
);

-- Payments: staff can view
DROP POLICY IF EXISTS "Admins view payments" ON public.book_payments;
DROP POLICY IF EXISTS "Staff view payments" ON public.book_payments;
CREATE POLICY "Staff view payments" ON public.book_payments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'manager'::app_role)
  OR public.has_role(auth.uid(), 'employee'::app_role)
);

-- ============ Record a book payment ============
CREATE OR REPLACE FUNCTION public.record_book_payment(
  p_reservation_id uuid,
  p_kind book_payment_kind,
  p_amount numeric,
  p_mpesa_receipt text DEFAULT NULL,
  p_mpesa_phone text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS public.book_reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  SELECT * INTO v_r FROM public.book_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;

  SELECT * INTO v_book FROM public.books WHERE id = v_r.book_id;

  -- Insert payment audit row
  INSERT INTO public.book_payments(reservation_id, kind, amount, mpesa_receipt, mpesa_phone, status)
  VALUES (p_reservation_id, p_kind, p_amount, p_mpesa_receipt, p_mpesa_phone, 'success');

  -- Update aggregate (refund = negative amount allowed)
  v_new_paid := GREATEST(0, COALESCE(v_r.amount_paid, 0) + p_amount);
  v_new_balance := GREATEST(0, v_book.full_price - v_new_paid);

  -- Auto status transition (don't downgrade collected/delivered/cancelled/released/refunded)
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
END;$$;

GRANT EXECUTE ON FUNCTION public.record_book_payment(uuid, book_payment_kind, numeric, text, text, text) TO authenticated;

-- ============ Update reservation status (staff) ============
CREATE OR REPLACE FUNCTION public.update_reservation_status(
  p_reservation_id uuid,
  p_status book_reservation_status,
  p_notes text DEFAULT NULL
) RETURNS public.book_reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_r public.book_reservations%ROWTYPE;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'employee'::app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.book_reservations
     SET status = p_status,
         notes = COALESCE(p_notes, notes)
   WHERE id = p_reservation_id
   RETURNING * INTO v_r;
  IF NOT FOUND THEN RAISE EXCEPTION 'Reservation not found'; END IF;
  RETURN v_r;
END;$$;

GRANT EXECUTE ON FUNCTION public.update_reservation_status(uuid, book_reservation_status, text) TO authenticated;
