-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;

-- Create new INSERT policies that explicitly allow both anon and authenticated roles
CREATE POLICY "Allow all users to insert orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow all users to insert order items"
ON public.order_items  
FOR INSERT
TO anon, authenticated
WITH CHECK (true);