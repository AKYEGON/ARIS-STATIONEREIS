-- Enable RLS on the testimonial_performance view
ALTER VIEW testimonial_performance SET (security_invoker = true);

-- Grant access to the view
GRANT SELECT ON testimonial_performance TO authenticated, anon;