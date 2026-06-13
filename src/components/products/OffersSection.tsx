import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BundleCard from "./BundleCard";
import BogoCard from "./BogoCard";
import ProductCard from "./ProductCard";
import { Bundle } from "@/types/bundle";
import { Product, ProductVariant } from "@/types/product";
import { BogoOffer } from "@/types/bogo";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { isOnSale } from "./SaleBadge";

/**
 * Homepage "Special Offers" row — unified marquee of every active offer type:
 * flash sales, regular bundles, course bundles, BOGO. Pauses on hover/touch.
 */
type OfferItem =
  | { kind: "bundle"; id: string; sort: number; bundle: Bundle }
  | { kind: "flash"; id: string; sort: number; product: Product }
  | { kind: "bogo"; id: string; sort: number; offer: BogoOffer };

const formatProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  saleStartsAt: p.sale_starts_at || null,
  saleEndsAt: p.sale_ends_at || null,
  category: p.category,
  image: p.image,
  is_featured: p.is_featured,
  display_order: p.display_order,
  slug: p.slug,
  media: (p.media || []).map((m: any) => ({ ...m, media_type: m.media_type as "image" | "video" })),
  variants: (p.variants || [])
    .filter((v: any) => v.is_active)
    .map((v: any) => ({ ...v, price: Number(v.price) })),
});

const formatCourseBundle = (b: any): Bundle => ({
  id: b.id,
  name: b.name,
  description: b.description ?? null,
  bundle_price: Number(b.bundle_price),
  original_total_price: Number(b.original_total_price),
  image: b.image || "",
  is_active: b.is_active ?? true,
  display_order: b.display_order ?? 0,
  created_at: b.created_at || "",
  items: (b.items || []).map((it: any) => ({
    id: it.id,
    bundle_id: b.id,
    product_id: it.product_id,
    quantity: it.quantity,
    product: it.product ? formatProduct(it.product) : undefined,
  })),
});

const OffersSection = () => {
  const { addToCart, addBundleToCart } = useCart();
  const [items, setItems] = useState<OfferItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [bundlesRes, courseBundlesRes, productsRes, bogoRes] = await Promise.all([
          supabase
            .from("bundles")
            .select(`*, items:bundle_items(*, product:products(*))`)
            .eq("is_active", true)
            .order("display_order", { ascending: false }),
          supabase
            .from("course_bundles")
            .select(`*, items:course_bundle_items(*, product:products(*))`)
            .eq("is_active", true)
            .order("display_order", { ascending: false }),
          supabase
            .from("products")
            .select(`*, media:product_media(*), variants:product_variants(*)`)
            .not("original_price", "is", null)
            .not("sale_ends_at", "is", null)
            .order("sale_ends_at", { ascending: true }),
          supabase
            .from("bogo_offers")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: false }),

        ]);

        const collected: OfferItem[] = [];

        (bundlesRes.data || []).forEach((b: any) =>
          collected.push({ kind: "bundle", id: `b-${b.id}`, sort: b.display_order ?? 0, bundle: b as Bundle }),
        );
        (courseBundlesRes.data || []).forEach((b: any) =>
          collected.push({ kind: "bundle", id: `cb-${b.id}`, sort: b.display_order ?? 0, bundle: formatCourseBundle(b) }),
        );
        (productsRes.data || [])
          .map(formatProduct)
          .filter((p) => isOnSale(p.price, p.originalPrice, p.saleStartsAt, p.saleEndsAt))
          .forEach((p) =>
            collected.push({ kind: "flash", id: `f-${p.id}`, sort: p.display_order ?? 0, product: p }),
          );
        // Hydrate BOGO products via a separate query (bogo_offers has no FK
        // constraints, so a PostgREST embed silently drops the rows).
        const bogoRows: any[] = bogoRes.data || [];
        const bogoProductIds = new Set<string>();
        bogoRows.forEach((b) => {
          if (b.product_id) bogoProductIds.add(b.product_id);
          if (b.free_product_id) bogoProductIds.add(b.free_product_id);
        });
        let productById = new Map<string, Product>();
        if (bogoProductIds.size > 0) {
          const { data: bogoProducts } = await supabase
            .from("products")
            .select("*, media:product_media(*), variants:product_variants(*)")
            .in("id", Array.from(bogoProductIds));
          productById = new Map(
            (bogoProducts || []).map((p: any) => [p.id, formatProduct(p)]),
          );
        }
        bogoRows.forEach((o: any) => {
          const product = productById.get(o.product_id);
          if (!product) return;
          const free_product = o.free_product_id
            ? productById.get(o.free_product_id) || null
            : null;
          collected.push({
            kind: "bogo",
            id: `g-${o.id}`,
            sort: o.display_order ?? 0,
            offer: { ...o, product, free_product },
          });
        });


        // Group by kind, sort each group by display_order desc, then round-robin
        // interleave so every offer type is represented near the start of the row.
        const groups: Record<OfferItem["kind"], OfferItem[]> = {
          flash: [],
          bundle: [],
          bogo: [],
        };
        collected.forEach((it) => groups[it.kind].push(it));
        (Object.keys(groups) as OfferItem["kind"][]).forEach((k) =>
          groups[k].sort((a, b) => b.sort - a.sort),
        );
        const interleaved: OfferItem[] = [];
        const order: OfferItem["kind"][] = ["flash", "bundle", "bogo"];
        let added = true;
        while (added) {
          added = false;
          for (const k of order) {
            const next = groups[k].shift();
            if (next) {
              interleaved.push(next);
              added = true;
            }
          }
        }
        setItems(interleaved);
      } catch (e) {
        console.error("Error fetching offers:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleAddProduct = (product: Product, variant?: ProductVariant) => addToCart(product, variant);

  // Duplicate the list so the marquee loop is seamless.
  const marquee = useMemo(() => [...items, ...items], [items]);

  if (isLoading || items.length === 0) return null;

  return (
    <section className="py-2 sm:py-3 md:py-6 px-3 sm:px-4 bg-muted/30">
      <div className="container max-w-4xl md:max-w-6xl">
        <div className="flex items-center justify-between mb-1.5 md:mb-4">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-primary">Special Offers</h2>
          <Link to="/deals">
            <Button variant="outline" size="sm" className="text-[10px] sm:text-xs md:text-sm h-6 md:h-8 px-2 md:px-3">
              View All
            </Button>
          </Link>
        </div>

        <div
          className="relative overflow-hidden"
          style={{ contain: "layout paint", isolation: "isolate" }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            className="flex items-start gap-2 md:gap-4 w-max will-change-transform"
            style={{
              animation: `horizontal-marquee ${Math.max(items.length * 5, 20)}s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
            }}
          >
            {marquee.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="w-[150px] sm:w-[180px] md:w-[220px] lg:w-[240px] h-[260px] sm:h-[316px] md:h-[352px] lg:h-[372px] flex-shrink-0"
              >
                {item.kind === "bundle" && (
                  <BundleCard bundle={item.bundle} onAddToCart={addBundleToCart} compact />
                )}
                {item.kind === "flash" && (
                  <ProductCard product={item.product} onAddToCart={handleAddProduct} compact />
                )}
                {item.kind === "bogo" && (
                  <BogoCard offer={item.offer} onAddToCart={handleAddProduct} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
