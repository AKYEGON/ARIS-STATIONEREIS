import { Product, ProductVariant } from "@/types/product";

export type StockState = "in_stock" | "out_of_stock" | "backorder";

export interface StockInfo {
  state: StockState;
  etaDays?: number | null;
  /** True when the item can still be added to the cart. */
  purchasable: boolean;
}

const resolve = (
  status: string | null | undefined,
  stock: number | null | undefined,
  etaDays: number | null | undefined,
): StockInfo => {
  if (status === "backorder") {
    return { state: "backorder", etaDays: etaDays ?? null, purchasable: true };
  }
  if (status === "out_of_stock" || Number(stock ?? 0) <= 0) {
    return { state: "out_of_stock", purchasable: false };
  }
  return { state: "in_stock", purchasable: true };
};

export const variantStock = (v: ProductVariant): StockInfo =>
  resolve(v.stock_status, v.stock, v.backorder_eta_days);

/**
 * Availability for a product, optionally narrowed to a chosen variant.
 * A product with variants is only unavailable when every variant is.
 */
export const productStock = (product: Product, variant?: ProductVariant): StockInfo => {
  if (variant) return variantStock(variant);

  const variants = product.variants || [];
  if (variants.length > 0) {
    const infos = variants.map(variantStock);
    if (infos.some((i) => i.state === "in_stock")) return { state: "in_stock", purchasable: true };
    const back = infos.find((i) => i.state === "backorder");
    if (back) return back;
    return { state: "out_of_stock", purchasable: false };
  }

  return resolve(product.stockStatus, product.stock, product.backorderEtaDays);
};

export const backorderLabel = (etaDays?: number | null) =>
  etaDays && etaDays > 0
    ? `Available on backorder, ships in ${etaDays} ${etaDays === 1 ? "day" : "days"}`
    : "Available on backorder, ships once the next batch lands";
