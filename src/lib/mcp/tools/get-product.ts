import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getPublicClient } from "../supabase";
import { PUBLIC_MEDIA_COLUMNS, PUBLIC_PRODUCT_COLUMNS, PUBLIC_VARIANT_COLUMNS } from "../../publicCatalog";

export default defineTool({
  name: "get_product",
  title: "Get product",
  description: "Fetch a single ARIS Stationeries product by slug, including variants and media.",
  inputSchema: {
    slug: z.string().min(1).describe("Product slug from the URL, e.g. 'kiwi-shoe-polish'"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const supabase = getPublicClient();
    const { data: product, error } = await supabase
      .from("products")
      .select(PUBLIC_PRODUCT_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!product) return { content: [{ type: "text", text: `No product with slug '${slug}'` }], isError: true };

    const [{ data: variants }, { data: media }] = await Promise.all([
      supabase.from("product_variants").select(PUBLIC_VARIANT_COLUMNS).eq("product_id", product.id),
      supabase.from("product_media").select(PUBLIC_MEDIA_COLUMNS).eq("product_id", product.id).order("display_order"),
    ]);

    const payload = { product, variants: variants ?? [], media: media ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
