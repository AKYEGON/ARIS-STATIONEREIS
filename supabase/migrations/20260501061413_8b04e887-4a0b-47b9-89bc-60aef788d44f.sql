-- Allow admins to delete orders (previously no DELETE policy existed)
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clean up test orders created during end-to-end testing
DELETE FROM public.orders
WHERE id IN (
  '6136f253-e9c7-473b-8d6c-09b5a29e615a',
  'da891e75-1485-455c-bf55-03d75efb2702'
);