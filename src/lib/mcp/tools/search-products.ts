import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getPublicClient } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search ARIS Stationeries products by name, description, or category. Returns matching products with price, stock, slug, and image.",
  inputSchema: {
    query: z.string().optional().describe("Free-text search across name and description"),
    category: z.string().optional().describe("Filter by exact category name"),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }) => {
    const supabase = getPublicClient();
    let q = supabase
      .from("products")
      .select("id, name, slug, price, original_price, category, image, stock, description, is_featured")
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true })
      .limit(limit ?? 20);

    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
