-- Add analytics columns to customer_testimonials table
ALTER TABLE customer_testimonials
ADD COLUMN views INTEGER DEFAULT 0,
ADD COLUMN completed_views INTEGER DEFAULT 0,
ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE;

-- Create story_views table for detailed analytics
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES customer_testimonials(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  view_duration INTEGER, -- in milliseconds
  user_session_id TEXT -- for tracking unique sessions
);

-- Create index for faster queries
CREATE INDEX idx_story_views_testimonial_id ON story_views(testimonial_id);
CREATE INDEX idx_story_views_viewed_at ON story_views(viewed_at);

-- Enable RLS for story_views
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Allow everyone to insert view records
CREATE POLICY "Anyone can insert story views"
  ON story_views FOR INSERT
  WITH CHECK (true);

-- Only admins can view story analytics
CREATE POLICY "Admins can view story analytics"
  ON story_views FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_testimonial_view(testimonial_id UUID, is_completed BOOLEAN DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the testimonial views count
  UPDATE customer_testimonials
  SET 
    views = views + 1,
    completed_views = CASE WHEN is_completed THEN completed_views + 1 ELSE completed_views END,
    last_viewed_at = NOW()
  WHERE id = testimonial_id;
END;
$$;