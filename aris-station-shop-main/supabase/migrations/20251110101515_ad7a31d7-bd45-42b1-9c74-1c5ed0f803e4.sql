-- Add RLS policies for admins to manage products
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));