import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  intro_copy: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export interface CategoryNode extends CategoryRecord {
  children: CategoryRecord[];
}

export const BASE_URL = "https://www.arisstationaries.co.ke";

/**
 * Categories are data, not markup. Adding a new main category (Room & Living,
 * Electronics, Printing...) is a row in product_categories with parent_id = null,
 * no code change required.
 */
export async function fetchCategoryRecords(): Promise<CategoryRecord[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id,name,slug,icon,image,parent_id,display_order,is_active,intro_copy,meta_title,meta_description")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return (data || []) as CategoryRecord[];
}

export function buildTree(records: CategoryRecord[]): CategoryNode[] {
  const roots = records.filter((c) => !c.parent_id);
  return roots.map((r) => ({
    ...r,
    children: records
      .filter((c) => c.parent_id === r.id)
      .sort((a, b) => a.display_order - b.display_order),
  }));
}

export function findBySlug(records: CategoryRecord[], slug?: string) {
  return records.find((c) => c.slug === slug) || null;
}

/** Canonical path for any category, main or sub. */
export function categoryPath(records: CategoryRecord[], cat: CategoryRecord): string {
  if (!cat.parent_id) return `/category/${cat.slug}`;
  const parent = records.find((c) => c.id === cat.parent_id);
  return parent ? `/category/${parent.slug}/${cat.slug}` : `/category/${cat.slug}`;
}

export const formatProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  saleStartsAt: p.sale_starts_at || null,
  saleEndsAt: p.sale_ends_at || null,
  category: p.category,
  image: p.image,
  stock: p.stock ?? undefined,
  is_featured: p.is_featured,
  display_order: p.display_order,
  slug: p.slug,
  media: (p.media || []).map((m: any) => ({ ...m, media_type: m.media_type as "image" | "video" })),
  variants: (p.variants || [])
    .filter((v: any) => v.is_active)
    .map((v: any) => ({ ...v, price: Number(v.price), cost_price: Number(v.cost_price) })),
});

const SELECT = `*, media:product_media(*), variants:product_variants(*)`;

/**
 * Products for one or more categories. Unions the legacy products.category text
 * column with the many-to-many assignments so nothing is lost.
 */
export async function fetchProductsForCategories(cats: CategoryRecord[]): Promise<Product[]> {
  if (cats.length === 0) return [];

  const [{ data: byText }, { data: assignments }] = await Promise.all([
    supabase.from("products").select(SELECT).in("category", cats.map((c) => c.name)),
    supabase
      .from("product_category_assignments")
      .select("product_id")
      .in("category_id", cats.map((c) => c.id)),
  ]);

  const assignedIds = Array.from(new Set((assignments || []).map((a: any) => a.product_id)));
  let byAssign: any[] = [];
  if (assignedIds.length > 0) {
    const { data } = await supabase.from("products").select(SELECT).in("id", assignedIds);
    byAssign = data || [];
  }

  const seen = new Set<string>();
  const merged: any[] = [];
  [...(byText || []), ...byAssign].forEach((p) => {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  });

  merged.sort((a, b) => {
    if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  return merged.map(formatProduct);
}

/** Meta defaults. Admin-supplied meta_title / meta_description always win. */
export function metaFor(cat: CategoryRecord, isMain: boolean) {
  const title =
    cat.meta_title ||
    (isMain
      ? `${cat.name} in Kenya - Prices & Same-Day Nairobi Delivery | ARIS`
      : `${cat.name} in Kenya | ARIS`);
  const description =
    cat.meta_description ||
    `${cat.name} for university students in Kenya. Real prices, in stock, same-day Nairobi delivery from ARIS.`;
  return { title, description };
}
