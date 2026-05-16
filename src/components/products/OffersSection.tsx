import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BundleCard from "./BundleCard";
import { Bundle } from "@/types/bundle";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

const AUTO_SCROLL_INTERVAL = 4000;

const OffersSection = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addBundleToCart } = useCart();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from("bundles")
        .select(`*, items:bundle_items(*, product:products(*))`)
        .eq("is_active", true)
        .order("display_order", { ascending: false })
        .limit(8);
      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate scroll progress for the sleek indicator bar
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return setScrollProgress(0);
    const progress = (scrollLeft / maxScroll) * 100;
    setScrollProgress(progress);
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;
    
    // Dynamically grab the width of the first card + gap
    const cardElement = container.firstElementChild as HTMLElement;
    if (!cardElement) return;
    
    const scrollAmount = cardElement.offsetWidth + 24; // 24px is the gap-6
    
    if (
      direction === "right" &&
      container.scrollLeft + container.clientWidth >= container.scrollWidth - 10
    ) {
      // Loop back to start smoothly
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ 
        left: direction === "left" ? -scrollAmount : scrollAmount, 
        behavior: "smooth" 
      });
    }
  }, []);

  // Auto-scroll logic (pauses on hover/touch)
  useEffect(() => {
    if (bundles.length <= 1 || isInteracting) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      return;
    }
    
    autoScrollRef.current = setInterval(() => scroll("right"), AUTO_SCROLL_INTERVAL);
    return () => { 
      if (autoScrollRef.current) clearInterval(autoScrollRef.current); 
    };
  }, [bundles.length, isInteracting, scroll]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      handleScroll(); // Init
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, bundles.length]);

  if (isLoading || bundles.length === 0) return null;

  return (
    <section className="relative py-12 md:py-20 bg-[#F8FAF9] border-b border-[#E5EBE6] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 xl:px-12">
        
        {/* ── Editorial Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#5C7A5F] mb-3">
              <span className="w-8 h-[2px] bg-[#5C7A5F]" />
              Curated Deals
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-[#2C3E35] font-serif">
              Exclusive Bundles
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/offers"
              className="group flex items-center gap-2 text-sm font-semibold text-[#2C3E35] pb-1 border-b border-[#2C3E35]/30 hover:border-[#2C3E35] transition-colors"
            >
              Explore All Offers
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Premium Navigation Arrows */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <button
                onClick={() => scroll("left")}
                className="w-11 h-11 flex items-center justify-center rounded-full border border-[#DDE8DF] bg-white text-[#4A5C50] transition-all hover:bg-[#2C3E35] hover:text-white hover:border-[#2C3E35] hover:scale-105 active:scale-95"
                aria-label="Previous items"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-11 h-11 flex items-center justify-center rounded-full border border-[#DDE8DF] bg-white text-[#4A5C50] transition-all hover:bg-[#2C3E35] hover:text-white hover:border-[#2C3E35] hover:scale-105 active:scale-95"
                aria-label="Next items"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Fluid Carousel Track ── */}
        <div 
          className="-mx-4 px-4 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12"
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onTouchStart={() => setIsInteracting(true)}
          onTouchEnd={() => setIsInteracting(false)}
        >
          <div
            ref={containerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {bundles.map((bundle, i) => (
              <div
                key={bundle.id}
                className="snap-start flex-shrink-0 w-[260px] sm:w-[300px] md:w-[340px] animate-fade-in group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Assumes BundleCard will fill its container. 
                  The subtle hover scale here adds a tactile feel. 
                */}
                <div className="h-full transition-transform duration-500 ease-out group-hover:-translate-y-1">
                  <BundleCard bundle={bundle} onAddToCart={addBundleToCart} compact={false} />
                </div>
              </div>
            ))}
            
            {/* Spacer to allow the last item to scroll fully into view with proper right padding */}
            <div className="flex-shrink-0 w-1 md:w-4" />
          </div>
        </div>

        {/* ── Smart Progress Indicator ── */}
        {bundles.length > 2 && (
          <div className="max-w-[200px] mx-auto mt-2 h-1 bg-[#DDE8DF] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5C7A5F] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(10, scrollProgress)}%` }}
            />
          </div>
        )}

      </div>
    </section>
  );
};

export default OffersSection;