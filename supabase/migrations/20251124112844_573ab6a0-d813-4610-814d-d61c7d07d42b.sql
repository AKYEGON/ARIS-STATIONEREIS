-- Add enhanced analytics columns to customer_testimonials table
ALTER TABLE customer_testimonials 
ADD COLUMN IF NOT EXISTS completion_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_view_duration integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score numeric DEFAULT 0;

-- Add index for better analytics query performance
CREATE INDEX IF NOT EXISTS idx_testimonials_analytics 
ON customer_testimonials(views, completed_views, is_published);

-- Create a view for testimonial performance comparison
CREATE OR REPLACE VIEW testimonial_performance AS
SELECT 
  id,
  customer_name,
  product_name,
  views,
  completed_views,
  CASE 
    WHEN views > 0 THEN ROUND((completed_views::numeric / views::numeric * 100), 2)
    ELSE 0 
  END as completion_rate_calc,
  average_view_duration,
  engagement_score,
  last_viewed_at,
  created_at
FROM customer_testimonials
WHERE is_published = true
ORDER BY engagement_score DESC, views DESC;