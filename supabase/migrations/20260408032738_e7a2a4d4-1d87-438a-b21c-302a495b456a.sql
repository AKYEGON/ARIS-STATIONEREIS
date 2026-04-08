
-- Create agent_zones table
CREATE TABLE public.agent_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active agent zones"
  ON public.agent_zones FOR SELECT USING (true);

CREATE POLICY "Admins can insert agent zones"
  ON public.agent_zones FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update agent zones"
  ON public.agent_zones FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete agent zones"
  ON public.agent_zones FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create agent_zone_assignments table
CREATE TABLE public.agent_zone_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  zone_id UUID NOT NULL REFERENCES public.agent_zones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, zone_id)
);

ALTER TABLE public.agent_zone_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all zone assignments"
  ON public.agent_zone_assignments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their own assignments"
  ON public.agent_zone_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert zone assignments"
  ON public.agent_zone_assignments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete zone assignments"
  ON public.agent_zone_assignments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update zone assignments"
  ON public.agent_zone_assignments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add agent_zone_id to orders
ALTER TABLE public.orders
  ADD COLUMN agent_zone_id UUID REFERENCES public.agent_zones(id);

-- Allow agents to view orders in their zone
CREATE POLICY "Agents can view their zone orders"
  ON public.orders FOR SELECT
  USING (
    has_role(auth.uid(), 'agent'::app_role)
    AND agent_zone_id IN (
      SELECT zone_id FROM public.agent_zone_assignments WHERE user_id = auth.uid()
    )
  );

-- Allow agents to update orders in their zone
CREATE POLICY "Agents can update their zone orders"
  ON public.orders FOR UPDATE
  USING (
    has_role(auth.uid(), 'agent'::app_role)
    AND agent_zone_id IN (
      SELECT zone_id FROM public.agent_zone_assignments WHERE user_id = auth.uid()
    )
  );

-- Allow agents to view order items for their zone orders
CREATE POLICY "Agents can view their zone order items"
  ON public.order_items FOR SELECT
  USING (
    has_role(auth.uid(), 'agent'::app_role)
    AND order_id IN (
      SELECT id FROM public.orders WHERE agent_zone_id IN (
        SELECT zone_id FROM public.agent_zone_assignments WHERE user_id = auth.uid()
      )
    )
  );

-- Allow agents to view/insert order communications for their zone orders
CREATE POLICY "Agents can view their zone communications"
  ON public.order_communications FOR SELECT
  USING (
    has_role(auth.uid(), 'agent'::app_role)
    AND order_id IN (
      SELECT id FROM public.orders WHERE agent_zone_id IN (
        SELECT zone_id FROM public.agent_zone_assignments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Agents can insert their zone communications"
  ON public.order_communications FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'agent'::app_role)
    AND order_id IN (
      SELECT id FROM public.orders WHERE agent_zone_id IN (
        SELECT zone_id FROM public.agent_zone_assignments WHERE user_id = auth.uid()
      )
    )
  );
