import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function computeEffectivePrice(product: any): { price: number; original_price: number | null; on_sale: boolean } {
  const price = Number(product.price);
  const originalPrice = product.original_price != null ? Number(product.original_price) : null;
  const now = Date.now();
  const startsAt = product.sale_starts_at ? new Date(product.sale_starts_at).getTime() : null;
  const endsAt = product.sale_ends_at ? new Date(product.sale_ends_at).getTime() : null;

  const inWindow =
    originalPrice !== null &&
    originalPrice > price &&
    (startsAt === null || startsAt <= now) &&
    (endsAt === null || endsAt >= now);

  const effective = inWindow
    ? price
    : originalPrice !== null && originalPrice > price
      ? originalPrice
      : price;

  const list = originalPrice !== null && originalPrice > effective ? originalPrice : null;

  return { price: effective, original_price: list, on_sale: inWindow };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Auth: X-API-Key header ----
    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
    if (!apiKey || apiKey.length < 20) {
      return jsonResponse({ error: "Missing or invalid X-API-Key header" }, 401);
    }

    const keyHash = await sha256Hex(apiKey);
    const { data: keyRows, error: keyError } = await supabase.rpc("verify_partner_api_key", {
      p_key_hash: keyHash,
    });

    if (keyError) {
      console.error("verify_partner_api_key error:", keyError);
      return jsonResponse({ error: "Authentication check failed" }, 500);
    }
    if (!keyRows || keyRows.length === 0) {
      return jsonResponse({ error: "Invalid or revoked API key" }, 401);
    }
    const partner = keyRows[0];

    // ---- Routing ----
    const url = new URL(req.url);
    // path looks like /marketplace-api/... — strip the function prefix
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("marketplace-api");
    const route = idx >= 0 ? parts.slice(idx + 1) : parts;
    const [resource, id] = route;

    // GET /categories
    if (resource === "categories") {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, slug, description")
        .order("name");
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ partner: partner.partner_name, data });
    }

    // GET /products/:idOrSlug
    if (resource === "products" && id) {
      const { data: byId } = await supabase
        .from("products")
        .select("*, media:product_media(*), variants:product_variants(*)")
        .or(`id.eq.${id},slug.eq.${id}`)
        .maybeSingle();

      if (!byId) return jsonResponse({ error: "Product not found" }, 404);

      const eff = computeEffectivePrice(byId);
      return jsonResponse({
        partner: partner.partner_name,
        data: {
          id: byId.id,
          slug: byId.slug,
          name: byId.name,
          description: byId.description,
          category: byId.category,
          image_url: byId.image,
          price: eff.price,
          original_price: eff.original_price,
          on_sale: eff.on_sale,
          currency: "KES",
          stock: byId.stock,
          in_stock: (byId.stock ?? 0) > 0,
          product_url: `https://arisstationaries.co.ke/product/${byId.slug || byId.id}`,
          media: (byId.media || []).map((m: any) => ({ type: m.media_type, url: m.media_url })),
          variants: (byId.variants || [])
            .filter((v: any) => v.is_active)
            .map((v: any) => ({
              id: v.id,
              type: v.variant_type,
              value: v.variant_value,
              price: Number(v.price),
              stock: v.stock,
            })),
          updated_at: byId.updated_at,
        },
      });
    }

    // GET /products?page=1&per_page=50&category=Pens&updated_since=ISO
    if (resource === "products") {
      const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
      const perPage = Math.min(200, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "50", 10)));
      const category = url.searchParams.get("category");
      const updatedSince = url.searchParams.get("updated_since");

      let query = supabase
        .from("products")
        .select("id, slug, name, description, category, image, price, original_price, sale_starts_at, sale_ends_at, stock, updated_at", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (category) query = query.eq("category", category);
      if (updatedSince) query = query.gte("updated_at", updatedSince);

      const { data, error, count } = await query;
      if (error) return jsonResponse({ error: error.message }, 500);

      const items = (data || []).map((p: any) => {
        const eff = computeEffectivePrice(p);
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          category: p.category,
          image_url: p.image,
          price: eff.price,
          original_price: eff.original_price,
          on_sale: eff.on_sale,
          currency: "KES",
          stock: p.stock,
          in_stock: (p.stock ?? 0) > 0,
          product_url: `https://arisstationaries.co.ke/product/${p.slug || p.id}`,
          updated_at: p.updated_at,
        };
      });

      return jsonResponse({
        partner: partner.partner_name,
        page,
        per_page: perPage,
        total: count ?? items.length,
        data: items,
      });
    }

    // GET /stock — lightweight sync feed (id, stock)
    if (resource === "stock") {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, stock, updated_at")
        .order("updated_at", { ascending: false });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ partner: partner.partner_name, data });
    }

    // Root / help
    if (!resource) {
      return jsonResponse({
        name: "ARIS Marketplace API",
        version: "1.0",
        partner: partner.partner_name,
        endpoints: [
          "GET /products?page=1&per_page=50&category=&updated_since=ISO",
          "GET /products/{id_or_slug}",
          "GET /categories",
          "GET /stock",
        ],
        auth: "Send header: X-API-Key: <your key>",
      });
    }

    return jsonResponse({ error: `Unknown endpoint: ${resource}` }, 404);
  } catch (err) {
    console.error("marketplace-api error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
