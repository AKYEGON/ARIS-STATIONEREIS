
-- Universities table
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campus branches table
CREATE TABLE public.campus_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(university_id, name)
);

-- Pickup outlets table
CREATE TABLE public.pickup_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public read access (customers need to see these in checkout)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_outlets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Anyone can read active branches" ON public.campus_branches FOR SELECT USING (true);
CREATE POLICY "Anyone can read active outlets" ON public.pickup_outlets FOR SELECT USING (true);

-- Admin/manager write access
CREATE POLICY "Admin/manager can manage universities" ON public.universities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager can manage branches" ON public.campus_branches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager can manage outlets" ON public.pickup_outlets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Seed initial data
INSERT INTO public.universities (name, display_order) VALUES ('University of Nairobi', 1);

INSERT INTO public.campus_branches (university_id, name, display_order)
SELECT u.id, b.name, b.ord
FROM public.universities u,
(VALUES ('Chiromo', 1), ('Main Campus', 2), ('Kikuyu', 3), ('Lower Kabete', 4), ('A.D.D', 5), ('Parklands', 6)) AS b(name, ord)
WHERE u.name = 'University of Nairobi';
