
CREATE TABLE public.year_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.year_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.year_templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_year_template_items_template ON public.year_template_items(template_id);

ALTER TABLE public.year_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view year templates" ON public.year_templates FOR SELECT USING (true);
CREATE POLICY "Admins insert year templates" ON public.year_templates FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update year templates" ON public.year_templates FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete year templates" ON public.year_templates FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view year template items" ON public.year_template_items FOR SELECT USING (true);
CREATE POLICY "Admins insert year template items" ON public.year_template_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update year template items" ON public.year_template_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete year template items" ON public.year_template_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_year_templates_updated_at BEFORE UPDATE ON public.year_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
