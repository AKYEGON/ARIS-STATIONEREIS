
CREATE POLICY "Anyone can upload customer photos for reviews"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'customer-photos');

CREATE POLICY "Anyone can upload testimonial videos for reviews"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'testimonial-videos');
