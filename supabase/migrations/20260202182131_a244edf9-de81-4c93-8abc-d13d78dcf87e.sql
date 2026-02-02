-- Order communications log
CREATE TABLE public.order_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'call', 'note')),
  message TEXT,
  status_at_time TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.order_communications ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_communications
CREATE POLICY "Admins can view order communications"
ON public.order_communications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert order communications"
ON public.order_communications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete order communications"
ON public.order_communications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add notes and priority fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Message templates table
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_status TEXT,
  channel TEXT DEFAULT 'whatsapp',
  template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_templates
CREATE POLICY "Admins can view message templates"
ON public.message_templates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert message templates"
ON public.message_templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update message templates"
ON public.message_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete message templates"
ON public.message_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default templates
INSERT INTO public.message_templates (name, trigger_status, template) VALUES
  ('Order Received', 'Pending', 'Hi {customer_name}! Thank you for your order #{order_id} at ARIS STATIONERIES. We''ve received it and will process it shortly. Total: KSh {total}'),
  ('Processing', 'Processing', 'Hi {customer_name}! Great news - your order #{order_id} is now being prepared. We''ll notify you once it''s ready for delivery!'),
  ('Shipped', 'Shipped', 'Hi {customer_name}! Your order #{order_id} is on its way! Delivery address: {delivery_address}. Questions? Reply here!'),
  ('Delivered', 'Delivered', 'Hi {customer_name}! Your order #{order_id} has been delivered. Thank you for shopping with ARIS STATIONERIES! We''d love your feedback 💙'),
  ('Cancelled', 'Cancelled', 'Hi {customer_name}, your order #{order_id} has been cancelled. If you have questions, please reach out. We hope to serve you again!');