import { defineTool } from "@lovable.dev/mcp-js";
import { getPublicClient } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List all active product categories at ARIS Stationeries.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, slug, display_order")
      .order("display_order");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { categories: data ?? [] },
    };
  },
});
