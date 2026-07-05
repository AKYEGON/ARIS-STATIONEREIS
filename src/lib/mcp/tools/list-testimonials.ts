import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getPublicClient } from "../supabase";

export default defineTool({
  name: "list_testimonials",
  title: "List customer testimonials",
  description: "List approved customer testimonials and reviews for ARIS Stationeries, ranked by rating.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("customer_testimonials")
      .select("id, customer_name, rating, review_text, image_url, created_at, product_id")
      .eq("is_approved", true)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { testimonials: data ?? [] },
    };
  },
});
