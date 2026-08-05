import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant } from "@/types/product";
import ProductCard from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { isOnSale } from "@/components/products/SaleBadge";
import { IconPriceDrop, IconArrowRight } from "@/components/icons/aris-icons";

const formatProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price ?? 0),
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
    .map((v: any) => ({ ...v, price: Number(v.price ?? 0) })),
});

interface Props {
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
}

/**
 * Live from the discount data, never hardcoded: any product with an active
 * price cut shows here, and drops off the moment the discount expires.
 */
const DealsCarousel = ({ onAddToCart }: Props) => {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*, media:product_media(*), variants:product_variants(*)")
        .not("original_price", "is", null)
        .order("sale_ends_at", { ascending: true, nullsFirst: false });

      if (cancelled) return;
      const live = (data || [])
        .map(formatProduct)
        .filter((p) => isOnSale(p.price, p.originalPrice, p.saleStartsAt, p.saleEndsAt))
        .sort((a, b) => {
          const da = a.originalPrice ? 1 - a.price / a.originalPrice : 0;
          const db = b.originalPrice ? 1 - b.price / b.originalPrice : 0;
          return db - da;
        })
        .slice(0, 12);
      setDeals(live);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * Math.min(320, trackRef.current.clientWidth * 0.8), behavior: "smooth" });
  };

  if (!loading && deals.length === 0) return null;

  return (
    <section className="border-y border-border bg-secondary/30 py-10 sm:py-14">
      <div className="container px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <IconPriceDrop size={22} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Deals
              </h2>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label="Scroll left">
              <IconArrowRight size={18} className="rotate-180" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label="Scroll right">
              <IconArrowRight size={18} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : (
          <div
            ref={trackRef}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {deals.map((p) => (
              <div key={p.id} className="w-[46%] min-w-[150px] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
                <ProductCard product={p} onAddToCart={onAddToCart} compact />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Link to="/deals" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            See every active deal
            <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DealsCarousel;
