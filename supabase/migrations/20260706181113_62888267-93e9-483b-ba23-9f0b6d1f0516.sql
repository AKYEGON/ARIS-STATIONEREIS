
-- Fix RLS_ALWAYS_TRUE on story_views
DROP POLICY IF EXISTS "Anyone can insert story views" ON public.story_views;
CREATE POLICY "Public can log story views"
ON public.story_views FOR INSERT
TO anon, authenticated
WITH CHECK (testimonial_id IS NOT NULL);

-- Revoke PUBLIC execute on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.release_reservation(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_testimonial_view(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_product_profit(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_review_request_by_token(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_variant_stock(uuid, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_store_credit_balance(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_review_by_token(uuid, text, integer, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_reservations_by_phone(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_book_slot(uuid, text, text, text, book_payment_type, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_reservation_status(uuid, book_reservation_status, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_store_credit(text, numeric, store_credit_source, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_book_payment(uuid, book_payment_kind, numeric, text, text, text) FROM PUBLIC;

-- Grant back the functions that need to be callable by clients
-- Public review flow (used by anon visitors on /review/:token)
GRANT EXECUTE ON FUNCTION public.get_review_request_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_review_by_token(uuid, text, integer, text, text, text) TO anon, authenticated;

-- Testimonial view tracking (called from public Testimonials page)
GRANT EXECUTE ON FUNCTION public.increment_testimonial_view(uuid, boolean) TO anon, authenticated;

-- Customer book reservation flow
GRANT EXECUTE ON FUNCTION public.reserve_book_slot(uuid, text, text, text, book_payment_type, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_reservations_by_phone(text) TO anon, authenticated;

-- Staff-only functions (self-check role inside): authenticated only
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_variant_stock(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reservation_status(uuid, book_reservation_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_store_credit(text, numeric, store_credit_source, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_book_payment(uuid, book_payment_kind, numeric, text, text, text) TO authenticated;
