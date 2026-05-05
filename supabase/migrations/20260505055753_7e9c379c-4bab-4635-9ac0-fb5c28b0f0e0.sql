-- Faculties (e.g. Engineering, Business, Medicine)
CREATE TABLE public.faculties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courses belong to a faculty (e.g. Mechanical under Engineering)
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (faculty_id, name)
);

-- Many-to-many: a product can belong to multiple courses
CREATE TABLE public.course_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, product_id)
);

CREATE INDEX idx_courses_faculty ON public.courses(faculty_id);
CREATE INDEX idx_course_products_course ON public.course_products(course_id);
CREATE INDEX idx_course_products_product ON public.course_products(product_id);

-- RLS
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_products ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view faculties" ON public.faculties FOR SELECT USING (true);
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Anyone can view course products" ON public.course_products FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admins insert faculties" ON public.faculties FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update faculties" ON public.faculties FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete faculties" ON public.faculties FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update courses" ON public.courses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete courses" ON public.courses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert course products" ON public.course_products FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update course products" ON public.course_products FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete course products" ON public.course_products FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER trg_faculties_updated_at BEFORE UPDATE ON public.faculties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();