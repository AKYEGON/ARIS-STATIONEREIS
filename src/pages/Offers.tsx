import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BundleCard from "@/components/products/BundleCard";
import SEO from "@/components/common/SEO";
import { Bundle } from "@/types/bundle";
import { supabase } from "@/integrations/supabase/client";

const Offers = () => {
  const { addBundleToCart, getCartItemCount } = useCart();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        .order("display_order", { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SEO
        title="Stationery Bundle Offers in Kenya | Aris Stationeries"
        description="Save more on stationery in Kenya with curated bundle offers from Aris Stationeries. Pens, notebooks, calculators and drawing sets at the best prices online."
        canonicalUrl="/offers"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Offers", url: "/offers" }]}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 py-6 sm:py-8 md:py-12" style={{ background: "#EFF6F0" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          {/* ── Section header ── */}
          <div className="mb-6 md:mb-8 flex items-center gap-3">
            {/* Accent pip */}
            <span
              className="hidden sm:block w-1 h-6 rounded-full"
              style={{ background: "linear-gradient(180deg,#5C7A5F,#A8C5AB)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5"
                style={{ color: "#7A9E7E" }}
              >
                Curated Deals
              </p>
              <h1
                className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight"
                style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}
              >
                Special Offers
              </h1>
            </div>
          </div>
          
          <p
            className="text-[13px] sm:text-[14px] mb-6 md:mb-8 max-w-2xl"
            style={{ color: "#7A8C80" }}
          >
            Save more with our specially curated bundle offers
          </p>

          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-base sm:text-lg text-muted-foreground">Loading offers...</p>
            </div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-base sm:text-lg text-muted-foreground">
                No offers available at the moment
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {bundles.map((bundle, index) => (
                <div
                  key={bundle.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <BundleCard bundle={bundle} onAddToCart={addBundleToCart} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Offers;
