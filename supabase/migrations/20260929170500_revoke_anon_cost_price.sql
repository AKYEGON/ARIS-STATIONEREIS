-- Wholesale cost is not a storefront field. The anon key ships in the
-- browser and in the public MCP server, and both were able to read
-- products.cost_price and product_variants.cost_price.
-- Staff stay on the authenticated role, which keeps SELECT.

REVOKE SELECT (cost_price) ON TABLE public.products FROM anon;
REVOKE SELECT (cost_price) ON TABLE public.product_variants FROM anon;
