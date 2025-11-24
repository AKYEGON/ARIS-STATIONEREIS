-- Create testimonials table
CREATE TABLE customer_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_photo TEXT NOT NULL,
  product_name TEXT,
  review_text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  video_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage buckets for customer photos and videos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('customer-photos', 'customer-photos', true),
  ('testimonial-videos', 'testimonial-videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for testimonials
ALTER TABLE customer_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published testimonials are viewable by everyone"
  ON customer_testimonials FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all testimonials"
  ON customer_testimonials FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert testimonials"
  ON customer_testimonials FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update testimonials"
  ON customer_testimonials FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete testimonials"
  ON customer_testimonials FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for customer photos
CREATE POLICY "Customer photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'customer-photos');

CREATE POLICY "Admins can upload customer photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'customer-photos' 
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update customer photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'customer-photos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete customer photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'customer-photos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Storage policies for testimonial videos
CREATE POLICY "Testimonial videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonial-videos');

CREATE POLICY "Admins can upload testimonial videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'testimonial-videos' 
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update testimonial videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'testimonial-videos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete testimonial videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'testimonial-videos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );