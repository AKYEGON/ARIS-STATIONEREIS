/**
 * Columns the storefront and public MCP tools may read.
 * `cost_price` stays off this list. Admin screens query it on their own.
 */

export const PUBLIC_PRODUCT_COLUMNS =
  "id,name,slug,description,price,original_price,stock,stock_status,backorder_eta_days,image,brand,category,is_featured,display_order,sale_starts_at,sale_ends_at";

export const PUBLIC_VARIANT_COLUMNS =
  "id,product_id,variant_type,variant_value,color_hex,price,stock,sku,is_active,display_order,stock_status,backorder_eta_days";

export const PUBLIC_MEDIA_COLUMNS =
  "id,product_id,media_url,media_type,display_order,created_at";

export const PUBLIC_PRODUCT_SELECT = `${PUBLIC_PRODUCT_COLUMNS}, media:product_media(${PUBLIC_MEDIA_COLUMNS}), variants:product_variants(${PUBLIC_VARIANT_COLUMNS})`;

/** Strip characters that would break a PostgREST `or()` filter. */
export function catalogSearchTerm(query: string): string {
  return query.replace(/[%_,.()"'\\]/g, " ").replace(/\s+/g, " ").trim();
}
