
CREATE TABLE public.partner_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,         -- first 8 chars, safe to display
  key_hash TEXT NOT NULL,           -- sha256 hex of the full key
  scopes TEXT[] NOT NULL DEFAULT ARRAY['products.read','categories.read','stock.read'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (key_hash)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_api_keys TO authenticated;
GRANT ALL ON public.partner_api_keys TO service_role;

ALTER TABLE public.partner_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view partner API keys"
ON public.partner_api_keys FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can create partner API keys"
ON public.partner_api_keys FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update partner API keys"
ON public.partner_api_keys FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can delete partner API keys"
ON public.partner_api_keys FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_partner_api_keys_updated_at
BEFORE UPDATE ON public.partner_api_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service-role-only helper: verify by sha256 hash, bump last_used_at, return key row
CREATE OR REPLACE FUNCTION public.verify_partner_api_key(p_key_hash text)
RETURNS TABLE (id uuid, partner_name text, scopes text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.partner_api_keys
     SET last_used_at = now()
   WHERE key_hash = p_key_hash
     AND is_active = true
     AND revoked_at IS NULL
   RETURNING partner_api_keys.id, partner_api_keys.partner_name, partner_api_keys.scopes;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_partner_api_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_partner_api_key(text) TO service_role;
