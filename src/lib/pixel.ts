/**
 * Meta Pixel helpers. The base snippet lives in index.html; these wrappers
 * keep event calls safe when the pixel is blocked or still loading.
 */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const track = (event: string, params?: Record<string, unknown>) => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
};

export const pixelPageView = () => track("PageView");

export const pixelViewContent = (p: { id: string; name: string; value?: number }) =>
  track("ViewContent", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    value: p.value ?? 0,
    currency: "KES",
  });

export const pixelAddToCart = (p: { id: string; name: string; value?: number; quantity?: number }) =>
  track("AddToCart", {
    content_ids: [p.id],
    content_name: p.name,
    content_type: "product",
    contents: [{ id: p.id, quantity: p.quantity ?? 1 }],
    value: p.value ?? 0,
    currency: "KES",
  });

export const pixelInitiateCheckout = (p: { value: number; numItems: number }) =>
  track("InitiateCheckout", {
    value: p.value,
    num_items: p.numItems,
    currency: "KES",
  });

export const pixelPurchase = (p: { value: number; orderId?: string; numItems?: number }) =>
  track("Purchase", {
    value: p.value,
    currency: "KES",
    num_items: p.numItems,
    order_id: p.orderId,
  });
