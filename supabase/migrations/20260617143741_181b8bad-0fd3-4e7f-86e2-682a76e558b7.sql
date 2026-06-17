
DROP POLICY IF EXISTS "Public submit by token" ON public.review_requests;

CREATE OR REPLACE FUNCTION public.submit_review_by_token(
  p_token uuid,
  p_customer_name text,
  p_rating integer,
  p_review_text text,
  p_customer_photo text DEFAULT NULL,
  p_video_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.review_requests%ROWTYPE;
  v_product_name text;
  v_testimonial_id uuid;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF length(coalesce(p_review_text,'')) < 10 THEN
    RAISE EXCEPTION 'Review text too short';
  END IF;

  SELECT * INTO v_request FROM public.review_requests
   WHERE token = p_token FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid review link';
  END IF;

  IF v_request.status = 'submitted' THEN
    RAISE EXCEPTION 'This review has already been submitted';
  END IF;

  SELECT name INTO v_product_name FROM public.products WHERE id = v_request.product_id;

  INSERT INTO public.customer_testimonials (
    customer_name, customer_photo, product_name, product_id, order_id,
    review_text, rating, video_url, is_verified_purchase, is_published, review_token
  ) VALUES (
    coalesce(p_customer_name, v_request.customer_name, 'Verified Customer'),
    p_customer_photo,
    v_product_name,
    v_request.product_id,
    v_request.order_id,
    p_review_text,
    p_rating,
    p_video_url,
    true,
    false, -- requires admin approval
    p_token
  ) RETURNING id INTO v_testimonial_id;

  UPDATE public.review_requests
     SET status = 'submitted', submitted_at = now(), testimonial_id = v_testimonial_id
   WHERE id = v_request.id;

  RETURN v_testimonial_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review_by_token(uuid, text, integer, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review_by_token(uuid, text, integer, text, text, text) TO anon, authenticated;
