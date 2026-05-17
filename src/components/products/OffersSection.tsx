import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BundleCard from "./BundleCard";
import { Bundle } from "@/types/bundle";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

const OffersSection = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addBundleToCart } = useCart();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from("bundles")
        .select(`
          *,
          items:bundle_items(
            *,
            product:products(*)
          )
        `)
        .eq("is_active", true)
        .order("display_order", { ascending: false })
        .limit(6);

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll removed on mobile — was causing repaint smearing on Chrome Android.
  // Mobile now uses a simple grid instead of a horizontally scrolling layer.

  if (isLoading || bundles.length === 0) return null;

  return (
    <section className="py-2 sm:py-3 md:py-6 px-3 sm:px-4 bg-muted/30">
      <div className="container max-w-4xl md:max-w-6xl">
        <div className="flex items-center justify-between mb-1.5 md:mb-4">
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-primary">
            Special Offers
          </h2>
          <Link to="/offers">
            <Button variant="outline" size="sm" className="text-[10px] sm:text-xs md:text-sm h-6 md:h-8 px-2 md:px-3">View All</Button>
          </Link>
        </div>

        {/* Horizontal marquee — same straight-line rotation on mobile and desktop */}
        <div
          className="relative overflow-hidden"
          style={{ contain: "layout paint", isolation: "isolate" }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            className="flex gap-2 md:gap-4 w-max will-change-transform"
            style={{
              animation: `horizontal-marquee ${Math.max(bundles.length * 5, 20)}s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
            }}
          >
            {[...bundles, ...bundles].map((bundle, index) => (
              <div
                key={`${bundle.id}-${index}`}
                className="w-[150px] sm:w-[180px] md:w-[220px] lg:w-[240px] flex-shrink-0"
              >
                <BundleCard bundle={bundle} onAddToCart={addBundleToCart} compact />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
