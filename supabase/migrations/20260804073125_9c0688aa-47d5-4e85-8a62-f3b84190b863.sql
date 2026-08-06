CREATE POLICY "Anyone can upload a school list file"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'school-lists');

CREATE POLICY "Staff can read school list files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'school-lists'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
      OR public.has_role(auth.uid(), 'employee'::app_role)
    )
  );

CREATE POLICY "Admins can delete school list files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-lists' AND public.has_role(auth.uid(), 'admin'::app_role));