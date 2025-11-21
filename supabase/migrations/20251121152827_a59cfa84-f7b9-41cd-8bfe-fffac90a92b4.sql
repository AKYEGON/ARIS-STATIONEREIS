-- Add discount fields to orders table
ALTER TABLE public.orders 
ADD COLUMN discount_amount NUMERIC DEFAULT 0,
ADD COLUMN discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', NULL)),
ADD COLUMN original_total NUMERIC;