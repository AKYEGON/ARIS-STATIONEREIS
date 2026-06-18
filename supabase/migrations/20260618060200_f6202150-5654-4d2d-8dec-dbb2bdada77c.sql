
-- ============ ENUMS ============
CREATE TYPE public.book_status AS ENUM ('draft','open','closed','fulfilled','cancelled');
CREATE TYPE public.book_payment_type AS ENUM ('deposit','full');
CREATE TYPE public.book_reservation_status AS ENUM (
  'pending_payment','reserved','balance_paid','collected','delivered','released','refunded','cancelled'
);
CREATE TYPE public.book_payment_kind AS ENUM ('deposit','balance','full');
CREATE TYPE public.book_payment_status AS ENUM ('pending','success','failed','cancelled');
CREATE TYPE public.store_credit_source AS ENUM ('book_refund','order_use','manual_adjust','book_release');

-- ============ BOOK GENRES ============
CREATE TABLE public.book_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.book_genres TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_genres TO authenticated;
GRANT ALL ON public.book_genres TO service_role;
ALTER TABLE public.book_genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active genres" ON public.book_genres
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage genres" ON public.book_genres
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_book_genres_updated BEFORE UPDATE ON public.book_genres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BOOKS ============
CREATE TABLE public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  genre_id uuid REFERENCES public.book_genres(id) ON DELETE SET NULL,
  cover_url text,
  synopsis text,
  isbn text,
  slug text UNIQUE,
  full_price numeric(10,2) NOT NULL CHECK (full_price >= 0),
  deposit_amount numeric(10,2) NOT NULL CHECK (deposit_amount >= 0),
  slots_total int NOT NULL CHECK (slots_total > 0),
  slots_reserved int NOT NULL DEFAULT 0 CHECK (slots_reserved >= 0),
  min_threshold int NOT NULL DEFAULT 0 CHECK (min_threshold >= 0),
  week_starts_at timestamptz NOT NULL,
  week_ends_at timestamptz NOT NULL,
  pickup_date timestamptz NOT NULL,
  status public.book_status NOT NULL DEFAULT 'draft',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_books_status_week ON public.books(status, week_starts_at, week_ends_at);
CREATE INDEX idx_books_slug ON public.books(slug);
GRANT SELECT ON public.books TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view open/closed books" ON public.books
  FOR SELECT USING (status IN ('open','closed','fulfilled') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage books" ON public.books
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_books_updated BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto slug
CREATE OR REPLACE FUNCTION public.set_book_slug() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.slugify(NEW.title) || '-' || substr(NEW.id::text,1,6);
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_books_slug BEFORE INSERT ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.set_book_slug();

-- ============ BOOK RESERVATIONS ============
CREATE TABLE public.book_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  payment_type public.book_payment_type NOT NULL,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  balance_due numeric(10,2) NOT NULL DEFAULT 0,
  mpesa_reference text,
  delivery_method text,
  delivery_details jsonb,
  status public.book_reservation_status NOT NULL DEFAULT 'pending_payment',
  store_credit_issued boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reservations_book ON public.book_reservations(book_id);
CREATE INDEX idx_reservations_phone ON public.book_reservations(customer_phone);
CREATE INDEX idx_reservations_status ON public.book_reservations(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_reservations TO authenticated;
GRANT ALL ON public.book_reservations TO service_role;
ALTER TABLE public.book_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage reservations" ON public.book_reservations
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
-- public reads done via SECURITY DEFINER functions by phone (no anon SELECT)

CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON public.book_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BOOK PAYMENTS (M-Pesa log) ============
CREATE TABLE public.book_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.book_reservations(id) ON DELETE CASCADE,
  kind public.book_payment_kind NOT NULL,
  amount numeric(10,2) NOT NULL,
  mpesa_checkout_id text,
  mpesa_receipt text,
  mpesa_phone text,
  status public.book_payment_status NOT NULL DEFAULT 'pending',
  raw_callback jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_reservation ON public.book_payments(reservation_id);
CREATE INDEX idx_payments_checkout ON public.book_payments(mpesa_checkout_id);
GRANT SELECT ON public.book_payments TO authenticated;
GRANT ALL ON public.book_payments TO service_role;
ALTER TABLE public.book_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view payments" ON public.book_payments
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.book_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORE CREDIT LEDGER ============
CREATE TABLE public.store_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone text NOT NULL,
  amount numeric(10,2) NOT NULL, -- positive=credit, negative=debit
  source public.store_credit_source NOT NULL,
  reference_id uuid,
  notes text,
  balance_after numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_phone ON public.store_credit_ledger(customer_phone, created_at DESC);
GRANT SELECT, INSERT ON public.store_credit_ledger TO authenticated;
GRANT ALL ON public.store_credit_ledger TO service_role;
ALTER TABLE public.store_credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage credit" ON public.store_credit_ledger
  FOR ALL USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Helper: current balance
CREATE OR REPLACE FUNCTION public.get_store_credit_balance(p_phone text)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(SUM(amount),0) FROM public.store_credit_ledger WHERE customer_phone = p_phone;
$$;

-- Helper: add credit entry (recomputes balance)
CREATE OR REPLACE FUNCTION public.add_store_credit(
  p_phone text, p_amount numeric, p_source public.store_credit_source,
  p_reference_id uuid DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_new_balance numeric; v_id uuid;
BEGIN
  v_new_balance := public.get_store_credit_balance(p_phone) + p_amount;
  INSERT INTO public.store_credit_ledger(customer_phone, amount, source, reference_id, notes, balance_after)
  VALUES (p_phone, p_amount, p_source, p_reference_id, p_notes, v_new_balance)
  RETURNING id INTO v_id;
  RETURN v_id;
END;$$;

-- ============ ATOMIC SLOT RESERVATION ============
CREATE OR REPLACE FUNCTION public.reserve_book_slot(
  p_book_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_payment_type public.book_payment_type,
  p_delivery_method text,
  p_delivery_details jsonb
) RETURNS public.book_reservations LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_book public.books%ROWTYPE;
  v_reservation public.book_reservations%ROWTYPE;
  v_amount numeric;
  v_balance numeric;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'Customer name required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'Customer phone required';
  END IF;

  SELECT * INTO v_book FROM public.books WHERE id = p_book_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Book not found'; END IF;
  IF v_book.status <> 'open' THEN RAISE EXCEPTION 'Book not open for reservations'; END IF;
  IF now() > v_book.week_ends_at THEN RAISE EXCEPTION 'Reservation window closed'; END IF;
  IF v_book.slots_reserved >= v_book.slots_total THEN RAISE EXCEPTION 'Sold out'; END IF;

  IF p_payment_type = 'deposit' THEN
    v_amount := v_book.deposit_amount;
    v_balance := v_book.full_price - v_book.deposit_amount;
  ELSE
    v_amount := v_book.full_price;
    v_balance := 0;
  END IF;

  UPDATE public.books SET slots_reserved = slots_reserved + 1 WHERE id = p_book_id;

  INSERT INTO public.book_reservations(
    book_id, customer_name, customer_phone, customer_email,
    payment_type, amount_paid, balance_due,
    delivery_method, delivery_details, status
  ) VALUES (
    p_book_id, p_customer_name, p_customer_phone, p_customer_email,
    p_payment_type, 0, v_balance,
    p_delivery_method, p_delivery_details, 'pending_payment'
  ) RETURNING * INTO v_reservation;

  RETURN v_reservation;
END;$$;

-- Public can call reservation function
GRANT EXECUTE ON FUNCTION public.reserve_book_slot(uuid,text,text,text,public.book_payment_type,text,jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_credit_balance(text) TO anon, authenticated;

-- Lookup reservations by phone (token-style lookup for self-service page)
CREATE OR REPLACE FUNCTION public.get_reservations_by_phone(p_phone text)
RETURNS TABLE(
  id uuid, book_id uuid, book_title text, book_cover text, pickup_date timestamptz,
  customer_name text, payment_type public.book_payment_type,
  amount_paid numeric, balance_due numeric, status public.book_reservation_status,
  created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT r.id, r.book_id, b.title, b.cover_url, b.pickup_date,
         r.customer_name, r.payment_type, r.amount_paid, r.balance_due, r.status, r.created_at
  FROM public.book_reservations r
  JOIN public.books b ON b.id = r.book_id
  WHERE r.customer_phone = p_phone
  ORDER BY r.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.get_reservations_by_phone(text) TO anon, authenticated;

-- Release a reservation (admin or cron) → free slot, optionally issue store credit
CREATE OR REPLACE FUNCTION public.release_reservation(p_reservation_id uuid, p_issue_credit boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_r public.book_reservations%ROWTYPE;
BEGIN
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
END;$$;

-- ============ SEED genres ============
INSERT INTO public.book_genres(name, slug, display_order) VALUES
  ('Fiction','fiction',1),
  ('Self-help','self-help',2),
  ('Academic','academic',3),
  ('Business','business',4),
  ('Religious','religious',5),
  ('Children','children',6),
  ('Biography','biography',7)
ON CONFLICT (slug) DO NOTHING;
