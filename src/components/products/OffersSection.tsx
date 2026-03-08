import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BundleCard from "./BundleCard";
import { Bundle } from "@/types/bundle";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_SCROLL_INTERVAL = 3000;

const OffersSection = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addBundleToCart } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
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

  const scroll = useCallback((direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const cardWidth = container.querySelector("div")?.offsetWidth || 160;
    const gap = 8;
    const scrollAmount = direction === "left" ? -(cardWidth + gap) : (cardWidth + gap);
    
    // If at the end, loop back to start
    if (direction === "right" && 
        container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (bundles.length <= 1 || isPaused) return;

    autoScrollRef.current = setInterval(() => {
      scroll("right");
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [bundles.length, isPaused, scroll]);

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

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {bundles.map((bundle, index) => (
            <div
              key={bundle.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <BundleCard bundle={bundle} onAddToCart={addBundleToCart} compact />
            </div>
          ))}
        </div>

        {/* Mobile: Horizontal scroll */}
        <div 
          className="relative md:hidden"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setTimeout(() => setIsPaused(false), 5000)}
        >
          <div
            ref={containerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {bundles.map((bundle, index) => (
              <div
                key={bundle.id}
                className="min-w-[140px] max-w-[160px] sm:min-w-[150px] sm:max-w-[170px] snap-start animate-fade-in flex-shrink-0"
                style={{ animationDelay: `${index * 0.1}s` }}
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
