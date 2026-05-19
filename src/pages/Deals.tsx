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
import { Flame, Tag, Package, Gift } from "lucide-react";
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
  const [discounted, setDiscounted] = useState<Product[]>([]);
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
        supabase
          .from("products")
          .select(`*, media:product_media(*), variants:product_variants(*)`)
          .not("original_price", "is", null)
          .order("display_order", { ascending: false }),
        supabase
          .from("bogo_offers")
          .select(`*, product:products!bogo_offers_product_id_fkey(*), free_product:products!bogo_offers_free_product_id_fkey(*)`)
          .eq("is_active", true)
          .order("display_order", { ascending: false }),
      ]);

      setBundles(bundlesRes.data || []);

      const products = (productsRes.data || []).map(formatProduct);
      const onSale = products.filter(p => isOnSale(p.price, p.originalPrice, p.saleStartsAt, p.saleEndsAt));
      const withWindow = onSale.filter(p => p.saleEndsAt);
      const withoutWindow = onSale.filter(p => !p.saleEndsAt);

      // Flash = those with active end window, sorted by soonest ending
      withWindow.sort((a, b) =>
        new Date(a.saleEndsAt!).getTime() - new Date(b.saleEndsAt!).getTime(),
      );
      setFlashSales(withWindow);
      setDiscounted(withoutWindow);

      // BOGO query may error if FK names differ; fall back to manual fetch
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

  const SectionHeader = ({ icon: Icon, title, subtitle, color }: any) => (
    <div className="flex items-center gap-3 mb-3 sm:mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );

  const nothing = !isLoading && bundles.length === 0 && flashSales.length === 0 && discounted.length === 0 && bogo.length === 0;

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SEO
        title="Deals & Special Offers in Kenya | Aris Stationeries"
        description="Flash sales, bundle deals, discounted stationery and Buy X Get Y offers from Aris Stationeries Kenya. Save more on pens, notebooks, calculators & drawing sets."
        canonicalUrl="/deals"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Deals", url: "/deals" }]}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Deals</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Flash sales, bundles & free items — refresh often
            </p>
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
              <SectionHeader icon={Flame} title="Flash Sales" subtitle="Limited time — ending soon" color="bg-red-600" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {flashSales.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />)}
              </div>
            </section>
          )}

          {discounted.length > 0 && (
            <section>
              <SectionHeader icon={Tag} title="Discounted Products" subtitle="Everyday savings" color="bg-emerald-600" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {discounted.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />)}
              </div>
            </section>
          )}

          {bundles.length > 0 && (
            <section>
              <SectionHeader icon={Package} title="Bundle Deals" subtitle="Save when you buy together" color="bg-primary" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {bundles.map(b => <BundleCard key={b.id} bundle={b} onAddToCart={addBundleToCart} />)}
              </div>
            </section>
          )}

          {bogo.length > 0 && (
            <section>
              <SectionHeader icon={Gift} title="Buy X, Get Y Free" subtitle="Auto-applied at checkout" color="bg-purple-600" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
