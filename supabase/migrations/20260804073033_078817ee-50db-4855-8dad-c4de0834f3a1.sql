ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS color_hex text;

CREATE TABLE public.school_list_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  school_or_course text,
  list_text text,
  file_url text,
  file_name text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.school_list_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_list_submissions TO authenticated;
GRANT ALL ON public.school_list_submissions TO service_role;

ALTER TABLE public.school_list_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a school list"
  ON public.school_list_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(customer_name)) > 0
    AND length(trim(customer_phone)) > 0
    AND (coalesce(list_text, '') <> '' OR coalesce(file_url, '') <> '')
  );

CREATE POLICY "Staff can view school lists"
  ON public.school_list_submissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Staff can update school lists"
  ON public.school_list_submissions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'employee'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'employee'::app_role)
  );

CREATE POLICY "Admins can delete school lists"
  ON public.school_list_submissions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_school_list_submissions_updated_at
  BEFORE UPDATE ON public.school_list_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();