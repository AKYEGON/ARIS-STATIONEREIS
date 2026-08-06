import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant } from "@/types/product";
import ProductCard from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { IconStorefront, IconArrowRight } from "@/components/icons/aris-icons";

const formatProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price ?? 0),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  saleStartsAt: p.sale_starts_at || null,
  saleEndsAt: p.sale_ends_at || null,
  stock: p.stock ?? 0,
  stockStatus: p.stock_status || 'active',
  backorderEtaDays: p.backorder_eta_days ?? null,
  category: p.category,
  image: p.image,
  is_featured: p.is_featured,
  display_order: p.display_order,
  slug: p.slug,
  media: (p.media || []).map((m: any) => ({ ...m, media_type: m.media_type as "image" | "video" })),
  variants: (p.variants || [])
    .filter((v: any) => v.is_active)
    .map((v: any) => ({ ...v, price: Number(v.price ?? 0) })),
});

interface Props {
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
}

const LIMIT = 8;

/**
 * Ranked by units actually sold in the last 30 days (get_top_selling_products).
 * Admin pins jump the queue, admin exclusions are filtered out in the RPC.
 * If there is no recent order history, falls back to featured products so the
 * strip is never empty on a quiet month.
 */
const PopularStrip = ({ onAddToCart }: Props) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromOrders, setFromOrders] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [topRes, pinRes] = await Promise.all([
        supabase.rpc("get_top_selling_products", { p_days: 30, p_limit: LIMIT }),
        supabase.from("homepage_picks").select("product_id,kind,display_order").order("display_order"),
      ]);

      const picks = pinRes.data || [];
      const pinnedIds = picks.filter((p: any) => p.kind === "pin").map((p: any) => p.product_id);
      const excluded = new Set(picks.filter((p: any) => p.kind === "exclude").map((p: any) => p.product_id));
      const soldIds = ((topRes.data as any[]) || []).map((r) => r.product_id).filter((id) => !excluded.has(id));

      let orderedIds = [...pinnedIds, ...soldIds.filter((id) => !pinnedIds.includes(id))].slice(0, LIMIT);
      const hasOrderData = soldIds.length > 0;

      let rows: any[] = [];
      if (orderedIds.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("*, media:product_media(*), variants:product_variants(*)")
          .in("id", orderedIds);
        rows = data || [];
      }

      if (rows.length < LIMIT) {
        const { data: fill } = await supabase
          .from("products")
          .select("*, media:product_media(*), variants:product_variants(*)")
          .eq("is_featured", true)
          .order("display_order", { ascending: true })
          .limit(LIMIT);
        const have = new Set(rows.map((r) => r.id));
        (fill || []).forEach((f) => {
          if (!have.has(f.id) && !excluded.has(f.id) && rows.length < LIMIT) {
            rows.push(f);
            orderedIds.push(f.id);
          }
        });
      }

      if (cancelled) return;
      const byId = new Map(rows.map((r) => [r.id, formatProduct(r)]));
      setItems(orderedIds.map((id) => byId.get(id)).filter(Boolean) as Product[]);
      setFromOrders(hasOrderData);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="container px-4 py-10 sm:py-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconStorefront size={22} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Best Sellers
            </h2>

          </div>
        </div>
        <Link to="/shop" className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex">
          Browse all
          <IconArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} compact />
          ))}
        </div>
      )}
    </section>
  );
};

export default PopularStrip;
