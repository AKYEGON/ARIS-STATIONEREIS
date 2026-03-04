
-- Fix: split ALL policies into separate INSERT, UPDATE, DELETE with proper checks
DROP POLICY "Admin/manager can manage universities" ON public.universities;
DROP POLICY "Admin/manager can manage branches" ON public.campus_branches;
DROP POLICY "Admin/manager can manage outlets" ON public.pickup_outlets;

CREATE POLICY "Admin/manager insert universities" ON public.universities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager update universities" ON public.universities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager delete universities" ON public.universities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin/manager insert branches" ON public.campus_branches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager update branches" ON public.campus_branches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager delete branches" ON public.campus_branches FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admin/manager insert outlets" ON public.pickup_outlets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager update outlets" ON public.pickup_outlets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Admin/manager delete outlets" ON public.pickup_outlets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
