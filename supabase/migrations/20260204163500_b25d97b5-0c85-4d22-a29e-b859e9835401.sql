-- Allow employees and managers to view orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Staff can view all orders"
  ON public.orders FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'employee')
  );

-- Allow employees and managers to update order status
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Staff can update orders"
  ON public.orders FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'employee')
  );

-- Allow employees and managers to view order items
DROP POLICY IF EXISTS "Admins can view order items" ON public.order_items;

CREATE POLICY "Staff can view order items"
  ON public.order_items FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'employee')
  );

-- Allow staff to view and add order communications
DROP POLICY IF EXISTS "Admins can view order communications" ON public.order_communications;

CREATE POLICY "Staff can view order communications"
  ON public.order_communications FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'employee')
  );

DROP POLICY IF EXISTS "Admins can insert order communications" ON public.order_communications;

CREATE POLICY "Staff can insert order communications"
  ON public.order_communications FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'employee')
  );

-- Allow admins to insert user roles (needed to add employees/managers)
CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow admins to update user roles
CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete user roles
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));