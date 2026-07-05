import { defineTool } from "@lovable.dev/mcp-js";
import { getPublicClient } from "../supabase";

export default defineTool({
  name: "list_deals",
  title: "List active deals",
  description: "List active flash sales, bundles, and BOGO (buy-one-get-one) offers at ARIS Stationeries.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = getPublicClient();
    const now = new Date().toISOString();
    const [flash, bundles, bogo] = await Promise.all([
      supabase.from("products").select("id, name, slug, price, original_price, sale_ends_at")
        .not("sale_ends_at", "is", null).gte("sale_ends_at", now),
      supabase.from("bundles").select("*").eq("is_active", true),
      supabase.from("bogo_offers").select("*").eq("is_active", true),
    ]);

    const payload = {
      flash_sales: flash.data ?? [],
      bundles: bundles.data ?? [],
      bogo_offers: bogo.data ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
