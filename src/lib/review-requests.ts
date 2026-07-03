import { supabase } from "@/integrations/supabase/client";

const SITE = "https://arisstationaries.co.ke";

export interface ReviewRequestRow {
  product_id: string;
  product_name: string;
  token: string;
  status: string;
}

/**
 * Idempotently ensure a review_requests row exists for every product in the order,
 * then return the full set. Safe to call repeatedly - relies on UNIQUE(order_id, product_id).
 */
export async function prepareReviewRequests(order: {
  id: string;
  customer_name: string;
  customer_phone: string;
  order_items?: { product_name: string }[];
}): Promise<ReviewRequestRow[]> {
  const names = Array.from(
    new Set((order.order_items || []).map((i) => i.product_name).filter(Boolean))
  );
  if (names.length === 0) return [];

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name")
    .in("name", names);
  if (prodErr) throw prodErr;

  const productMap = new Map((products || []).map((p) => [p.name, p.id]));

  const { data: existing, error: exErr } = await supabase
    .from("review_requests")
    .select("product_id, token, status")
    .eq("order_id", order.id);
  if (exErr) throw exErr;

  const existingByProduct = new Map((existing || []).map((r) => [r.product_id, r]));

  const toCreate: {
    order_id: string;
    product_id: string;
    customer_name: string;
    customer_phone: string;
  }[] = [];
  for (const name of names) {
    const pid = productMap.get(name);
    if (!pid) continue;
    if (!existingByProduct.has(pid)) {
      toCreate.push({
        order_id: order.id,
        product_id: pid,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
      });
    }
  }

  if (toCreate.length) {
    const { error: insErr } = await supabase.from("review_requests").insert(toCreate);
    if (insErr) throw insErr;
  }

  const { data: finalRows, error: finalErr } = await supabase
    .from("review_requests")
    .select("product_id, token, status")
    .eq("order_id", order.id);
  if (finalErr) throw finalErr;

  return (finalRows || []).map((r) => {
    const name =
      [...productMap.entries()].find(([, id]) => id === r.product_id)?.[0] || "Product";
    return {
      product_id: r.product_id,
      product_name: name,
      token: r.token,
      status: r.status,
    };
  });
}

/**
 * Mark all non-submitted review_requests for an order as sent via the given channel.
 */
export async function markReviewRequestsSent(
  orderId: string,
  channel: "whatsapp" | "sms"
) {
  const { data: rows } = await supabase
    .from("review_requests")
    .select("product_id, status")
    .eq("order_id", orderId);
  const pendingIds = (rows || [])
    .filter((r) => r.status !== "submitted")
    .map((r) => r.product_id);
  if (pendingIds.length === 0) return;
  await supabase
    .from("review_requests")
    .update({ status: "sent", sent_at: new Date().toISOString(), sent_via: channel })
    .eq("order_id", orderId)
    .in("product_id", pendingIds);
}

/**
 * Build the unified review-request message body shown to customers
 * after Delivered / Picked Up.
 */
export function buildReviewMessage(customerName: string, rows: ReviewRequestRow[]): string {
  const intro = `Hello ${customerName},\n\nThank you for shopping with ARIS.\n\nWe'd love your honest feedback on the items from your recent order:\n`;
  const list = rows
    .map((r, i) => `\n${i + 1}. ${r.product_name}\n${SITE}/review/${r.token}`)
    .join("");
  const outro = `\n\nReview any or all - even a quick rating helps fellow students choose with confidence.\n\nARIS`;
  return intro + list + outro;
}

/**
 * Build the per-status message body for Delivered / Picked Up that wraps the
 * review links with the right intro for that status.
 */
export function buildStatusReviewMessage(
  status: "delivered" | "picked_up",
  order: { customer_name: string; id: string },
  rows: ReviewRequestRow[]
): string {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const header =
    status === "delivered"
      ? `Hi ${order.customer_name}! Your order #${shortId} has been delivered. Thank you for shopping with ARIS!`
      : `Hi ${order.customer_name}! Thank you for picking up your order #${shortId} at ARIS.`;

  if (rows.length === 0) {
    return `${header}\n\nWe'd love to hear your feedback - reply here any time.`;
  }

  const list = rows
    .map((r, i) => `\n${i + 1}. ${r.product_name}\n${SITE}/review/${r.token}`)
    .join("");

  return `${header}\n\nWe'd love your honest feedback on the items you received:\n${list}\n\nReview any or all - even a quick rating helps fellow students choose with confidence.`;
}

export function isReviewTriggerStatus(status: string): "delivered" | "picked_up" | null {
  const s = status.toLowerCase().trim();
  if (s === "delivered") return "delivered";
  if (["picked up", "picked-up", "pickedup"].includes(s)) return "picked_up";
  return null;
}
