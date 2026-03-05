import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BundleCard from "./BundleCard";
import { Bundle } from "@/types/bundle";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

const OffersSection = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addBundleToCart } = useCart();

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

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("bundles-container");
    if (container) {
      const scrollAmount = direction === "left" ? -250 : 250;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (isLoading || bundles.length === 0) return null;

  return (
    <section className="py-3 sm:py-4 px-4 bg-muted/30">
      <div className="container">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg sm:text-xl font-bold text-primary">
            Special Offers
          </h2>
          <Link to="/offers">
            <Button variant="outline" size="sm" className="text-xs h-7">View All</Button>
          </Link>
        </div>

        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-8 w-8"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          <div
            id="bundles-container"
            className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {bundles.map((bundle, index) => (
              <div
                key={bundle.id}
                className="min-w-[200px] sm:min-w-[240px] snap-start animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BundleCard bundle={bundle} onAddToCart={addBundleToCart} />
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-8 w-8"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OffersSection;
