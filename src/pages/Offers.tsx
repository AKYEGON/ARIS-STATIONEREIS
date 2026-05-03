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

      <main className="flex-1 container py-6 sm:py-8 md:py-12 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-primary">
            Special Offers
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
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
