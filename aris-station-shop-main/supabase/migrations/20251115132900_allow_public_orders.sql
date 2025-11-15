-- Allow public to insert orders (for shopping cart checkout)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Orders are insertable by everyone" ON public.orders;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Allow public to insert order items
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Anyone can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

-- Keep admin-only policies for viewing and updating
-- Admins can still view and manage all orders
