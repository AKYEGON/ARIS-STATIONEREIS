
-- 1. Orders: remove permissive anon/authenticated insert policy
DROP POLICY IF EXISTS "Allow all users to insert orders" ON public.orders;

-- 2. Storage: drop unrestricted anon upload policies, replace with mime/size checks
DROP POLICY IF EXISTS "Anyone can upload customer photos for reviews" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload testimonial videos for reviews" ON storage.objects;

CREATE POLICY "Public can upload review photos (image, <=5MB)"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'customer-photos'
  AND (lower(coalesce(metadata->>'mimetype','')) LIKE 'image/%')
  AND coalesce((metadata->>'size')::bigint, 0) <= 5242880
);

CREATE POLICY "Public can upload review videos (video, <=50MB)"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'testimonial-videos'
  AND (lower(coalesce(metadata->>'mimetype','')) LIKE 'video/%')
  AND coalesce((metadata->>'size')::bigint, 0) <= 52428800
);

-- 3. Storage: prevent listing of public buckets (files still served via public URL)
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Customer photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Testimonial videos are publicly accessible" ON storage.objects;

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated by default,
--    then grant back only those needed by client code.
REVOKE EXECUTE ON FUNCTION public.release_reservation(uuid, boolean) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_store_credit(text, numeric, store_credit_source, uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_variant_stock(uuid, integer, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_book_payment(uuid, book_payment_kind, numeric, text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_reservation_status(uuid, book_reservation_status, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_store_credit_balance(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_reservations_by_phone(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_book_slot(uuid, text, text, text, book_payment_type, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_product_profit(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;

-- Admin-only stock functions: grant back to authenticated (function itself checks admin role)
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_variant_stock(uuid, integer, text, text) TO authenticated;
