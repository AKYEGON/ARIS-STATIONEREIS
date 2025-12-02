-- 1. Make customer_photo nullable (optional)
ALTER TABLE customer_testimonials 
ALTER COLUMN customer_photo DROP NOT NULL;

-- 2. Add RLS policy for public submissions (only unpublished)
CREATE POLICY "Anyone can submit unpublished testimonials"
ON customer_testimonials
FOR INSERT
WITH CHECK (is_published = false);