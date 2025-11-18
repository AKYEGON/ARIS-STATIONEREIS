-- Add new columns to products table for inventory management
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Create stock_movements table for tracking inventory changes
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  change INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('purchase', 'damage', 'sale', 'correction', 'return')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on stock_movements
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_movements
CREATE POLICY "Admins can view stock movements"
ON public.stock_movements
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert stock movements"
ON public.stock_movements
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add new columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update orders status to use proper values
ALTER TABLE public.orders
ALTER COLUMN status SET DEFAULT 'Pending';

-- Add new columns to order_items table
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit NUMERIC DEFAULT 0;

-- Create function to calculate product profit
CREATE OR REPLACE FUNCTION public.calculate_product_profit(product_id UUID)
RETURNS NUMERIC
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(
    (SELECT price - COALESCE(cost_price, 0) FROM public.products WHERE id = product_id),
    0
  )
$$;

-- Create function to update stock and log movement
CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_product_id UUID,
  p_change INTEGER,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update product stock
  UPDATE public.products
  SET stock = stock + p_change
  WHERE id = p_product_id;
  
  -- Log the movement
  INSERT INTO public.stock_movements (product_id, change, reason, notes)
  VALUES (p_product_id, p_change, p_reason, p_notes);
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);