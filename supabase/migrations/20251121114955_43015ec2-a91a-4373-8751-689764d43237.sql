-- Ensure anonymous users can create orders without authentication
-- This is safe because we don't expose sensitive order data publicly

-- Drop and recreate the insert policy for orders with explicit anon access
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Allow anonymous order creation"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Drop and recreate the insert policy for order_items with explicit anon access  
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Allow anonymous order items creation"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;