import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BundleCard from "@/components/products/BundleCard";
import ProductCard from "@/components/products/ProductCard";
import BogoCard from "@/components/products/BogoCard";
import SEO from "@/components/common/SEO";
import { Bundle } from "@/types/bundle";
import { Product, ProductVariant } from "@/types/product";
import { BogoOffer } from "@/types/bogo";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Package, Gift } from "lucide-react";
import { isOnSale } from "@/components/products/SaleBadge";

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
  variants: (p.variants || []).filter((v: any) => v.is_active).map((v: any) => ({ ...v, price: Number(v.price) })),
});

const Deals = () => {
  const { addToCart, addBundleToCart, getCartItemCount } = useCart();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [flashSales, setFlashSales] = useState<Product[]>([]);
  const [bogo, setBogo] = useState<BogoOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [bundlesRes, productsRes, bogoRes] = await Promise.all([
        supabase
          .from("bundles")
          .select(`*, items:bundle_items(*, product:products(*))`)
          .eq("is_active", true)
          .order("display_order", { ascending: false }),
        // Every product with a live price cut, exactly like the homepage carousel.
        // (The old query also required sale_ends_at to be set, so open-ended
        // discounts - which is most of them - never reached this page.)
        supabase
          .from("products")
          .select(`*, media:product_media(*), variants:product_variants(*)`)
          .not("original_price", "is", null)
          .order("sale_ends_at", { ascending: true, nullsFirst: false }),
        supabase
          .from("bogo_offers")
          .select(`*, product:products!bogo_offers_product_id_fkey(*), free_product:products!bogo_offers_free_product_id_fkey(*)`)
          .eq("is_active", true)
          .order("display_order", { ascending: false }),
      ]);

      setBundles(bundlesRes.data || []);

      const products = (productsRes.data || []).map(formatProduct);
      // Keep only products currently inside their active flash window
      const liveFlash = products.filter(p =>
        isOnSale(p.price, p.originalPrice, p.saleStartsAt, p.saleEndsAt),
      );
      setFlashSales(liveFlash);

      if (bogoRes.error) {
        const { data: rawBogo } = await supabase
          .from("bogo_offers")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: false });
        const productIds = new Set<string>();
        (rawBogo || []).forEach((b: any) => {
          if (b.product_id) productIds.add(b.product_id);
          if (b.free_product_id) productIds.add(b.free_product_id);
        });
        if (productIds.size > 0) {
          const { data: relProducts } = await supabase
            .from("products")
            .select("*")
            .in("id", Array.from(productIds));
          const byId = new Map((relProducts || []).map((p: any) => [p.id, formatProduct(p)]));
          setBogo(
            (rawBogo || []).map((b: any) => ({
              ...b,
              product: byId.get(b.product_id),
              free_product: b.free_product_id ? byId.get(b.free_product_id) : null,
            })),
          );
        } else {
          setBogo([]);
        }
      } else {
        setBogo(
          (bogoRes.data || []).map((b: any) => ({
            ...b,
            product: b.product ? formatProduct(b.product) : undefined,
            free_product: b.free_product ? formatProduct(b.free_product) : null,
          })),
        );
      }
    } catch (err) {
      console.error("Error fetching deals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (product: Product, variant?: ProductVariant) => addToCart(product, variant);

  const SectionHeader = ({ icon: Icon, title, color }: any) => (
    <div className="flex items-center gap-3 mb-3 sm:mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{title}</h2>
      </div>
    </div>
  );

  const nothing =
    !isLoading &&
    bundles.length === 0 &&
    flashSales.length === 0 &&
    bogo.length === 0;

  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
      <SEO
        title="Deals worth actually opening | ARIS"
        description="What's on right now - flash sales counting down, bundles priced as a pack, and buy-X-get-Y freebies that drop into your cart on their own."
        canonicalUrl="/deals"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Deals", url: "/deals" }]}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Deals</h1>
          </div>

          {isLoading && (
            <div className="text-center py-12"><p className="text-muted-foreground">Loading deals…</p></div>
          )}

          {nothing && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No active deals right now. Check back soon!</p>
              <Link to="/" className="inline-block mt-4 text-primary underline">Browse all products</Link>
            </div>
          )}

          {flashSales.length > 0 && (
            <section>
              <SectionHeader icon={Flame} title="Flash Sales" color="bg-red-600" />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 auto-rows-fr">
                {flashSales.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAdd} compact />)}
              </div>
            </section>
          )}


          {bundles.length > 0 && (
            <section>
              <SectionHeader icon={Package} title="Bundle Deals" color="bg-primary" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 auto-rows-fr">
                {bundles.map(b => <BundleCard key={b.id} bundle={b} onAddToCart={addBundleToCart} compact />)}
              </div>
            </section>
          )}

          {bogo.length > 0 && (
            <section>
              <SectionHeader icon={Gift} title="Buy X, Get Y Free" color="bg-purple-600" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 auto-rows-fr">
                {bogo.map(o => <BogoCard key={o.id} offer={o} onAddToCart={handleAdd} />)}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Deals;
