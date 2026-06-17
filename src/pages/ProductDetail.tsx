import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant } from "@/types/product";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import ProductCard from "@/components/products/ProductCard";
import ProductMediaViewer from "@/components/products/ProductMediaViewer";
import ProductReviews from "@/components/products/ProductReviews";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ChevronRight, Truck, ShieldCheck, Phone, Images } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const formatProduct = (p: any): Product & { slug?: string } => ({
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
  media: ((p as any).media || []).map((m: any) => ({
    ...m,
    media_type: m.media_type as "image" | "video",
  })),
  variants: ((p as any).variants || [])
    .filter((v: any) => v.is_active)
    .map((v: any) => ({
      ...v,
      price: Number(v.price),
      cost_price: Number(v.cost_price),
    })),
});

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemCount } = useCart();
  const [product, setProduct] = useState<(Product & { slug?: string }) | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`*, media:product_media(*), variants:product_variants(*)`)
        .eq("slug", slug)
        .maybeSingle();

      let row = data;
      if (!row) {
        // Fallback: legacy/internal links that use the product id
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        if (isUuid) {
          const { data: byId } = await supabase
            .from("products")
            .select(`*, media:product_media(*), variants:product_variants(*)`)
            .eq("id", slug)
            .maybeSingle();
          row = byId || null;
        }
      }

      if (error) throw error;
      if (!row) {
        setNotFound(true);
        setProduct(null);
        return;
      }
      const p = formatProduct(row);
      // SEO: if user landed via UUID or stale slug, redirect to the canonical slug URL
      if (p.slug && p.slug !== slug) {
        navigate(`/product/${p.slug}`, { replace: true });
        return;
      }
      setProduct(p);
      setSelectedVariant(undefined);
      setActiveMediaIndex(0);

      const { data: relData } = await supabase
        .from("products")
        .select(`*, media:product_media(*), variants:product_variants(*)`)
        .eq("category", p.category)
        .neq("id", p.id)
        .limit(8);
      setRelated((relData || []).map(formatProduct));
    } catch (err) {
      console.error("Error fetching product:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted w-1/3 rounded" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-3">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-20 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEO
          title="Product Not Found"
          description="The product you are looking for could not be found."
          canonicalUrl={`/product/${slug}`}
          noindex
        />
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">
            This product may have been removed or the link is incorrect.
          </p>
          <Button onClick={() => navigate("/")}>Back to shop</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const hasVariants = !!(product.variants && product.variants.length > 0);
  const variantGroups = hasVariants
    ? product.variants!.reduce<Record<string, ProductVariant[]>>((acc, v) => {
        if (!acc[v.variant_type]) acc[v.variant_type] = [];
        acc[v.variant_type].push(v);
        return acc;
      }, {})
    : {};

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const allMedia = [
    { type: "image" as const, url: product.image },
    ...(product.media?.map((m) => ({ type: m.media_type, url: m.media_url })) || []),
  ];
  const activeMedia = allMedia[activeMediaIndex] || allMedia[0];

  const productSlug = product.slug || slug || "";
  const productUrl = `/product/${productSlug}`;
  const fullUrl = `https://arisstationaries.co.ke${productUrl}`;
  const fullImage = product.image.startsWith("http")
    ? product.image
    : `https://arisstationaries.co.ke${product.image}`;

  const seoTitle = `${product.name} — KSh ${displayPrice.toFixed(0)} | Price in Kenya | ARIS Stationeries`.slice(0, 70);
  const seoDescription = `Buy ${product.name} in Kenya at ARIS Stationeries Nairobi for KSh ${displayPrice.toFixed(0)}. ${product.description || "In stock — same-day Nairobi pickup, countrywide delivery."}`.slice(0, 160);

  const fallbackDescription = `${product.name} available in Kenya at ARIS Stationeries Nairobi. Genuine ${product.category.toLowerCase()} stock with same-day Nairobi pick-up and countrywide delivery. Order online or via WhatsApp +254 119 774 470.`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description && product.description.trim().length > 20
      ? product.description
      : fallbackDescription,
    image: fullImage,
    sku: product.id,
    mpn: product.id,
    category: product.category,
    brand: { "@type": "Brand", name: "ARIS Stationeries" },
    offers: {
      "@type": "Offer",
      url: fullUrl,
      priceCurrency: "KES",
      price: displayPrice,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "ARIS Stationeries" },
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "KES",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "KE",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "KE",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      toast.error("Please select an option first");
      return;
    }
    addToCart(product, selectedVariant);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={productUrl}
        ogImage={fullImage}
        ogType="product"
        keywords={`${product.name}, ${product.category}, buy ${product.name} Kenya, ${product.name} price Kenya, Aris Stationeries`}
        structuredData={productSchema}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: product.category, url: `/category/${product.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}` },
          { name: product.name, url: productUrl },
        ]}
      />

      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap"
        >
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to={`/category/${product.category
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")}`}
            className="hover:text-primary truncate max-w-[160px]"
          >
            {product.category}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 mb-10">
          {/* Image column */}
          <div className="space-y-3">
            <Card
              className="aspect-square bg-white flex items-center justify-center cursor-zoom-in relative overflow-hidden"
              onClick={() => setViewerOpen(true)}
            >
              {activeMedia.type === "image" ? (
                <img
                  src={activeMedia.url}
                  alt={`${product.name} - ${product.description} - Buy at ARIS STATIONERIES Kenya`}
                  className="max-h-full max-w-full object-contain p-4"
                />
              ) : (
                <video src={activeMedia.url} className="max-h-full max-w-full" controls />
              )}
              {allMedia.length > 1 && (
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
                  <Images className="h-3 w-3" />
                  <span>{allMedia.length}</span>
                </div>
              )}
            </Card>

            {allMedia.length > 1 && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {allMedia.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveMediaIndex(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-md border-2 bg-white overflow-hidden transition-all ${
                      i === activeMediaIndex
                        ? "border-primary"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    {m.type === "image" ? (
                      <img
                        src={m.url}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        ▶
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                {product.category}
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline flex-wrap gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-primary">
                KSh {displayPrice.toFixed(0)}
              </span>
              {!selectedVariant && product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    KSh {product.originalPrice.toFixed(0)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                    Save KSh {(product.originalPrice - product.price).toFixed(0)}
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <div>
                <h2 className="text-sm font-semibold mb-1">Description</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {hasVariants &&
              Object.entries(variantGroups).map(([type, variants]) => (
                <div key={type}>
                  <p className="text-sm font-semibold mb-2">
                    {type}{" "}
                    {!selectedVariant && (
                      <span className="text-destructive font-normal">*required</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const outOfStock = v.stock <= 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() =>
                            !outOfStock && setSelectedVariant(selectedVariant?.id === v.id ? undefined : v)
                          }
                          className={`text-sm px-3 py-2 rounded-md border transition-all ${
                            outOfStock
                              ? "border-border/40 bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through"
                              : selectedVariant?.id === v.id
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border hover:border-primary/50"
                          }`}
                        >
                          {v.variant_value}
                          <span className="ml-1.5 opacity-70 text-xs">
                            {outOfStock ? "Out of Stock" : `KSh ${v.price.toFixed(0)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            <Button size="lg" className="w-full h-12 text-base" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              {hasVariants && !selectedVariant ? "Select Option" : "Add to Cart"}
            </Button>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
              <div className="flex flex-col items-center text-center gap-1 p-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  Nationwide Delivery
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  Genuine Stationery
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1 p-2">
                <Phone className="h-5 w-5 text-primary" />
                <a
                  href="tel:+254119774470"
                  className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary"
                >
                  +254 119 774 470
                </a>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="pt-6 border-t">
            <h2 className="text-lg sm:text-xl font-bold mb-4">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.slice(0, 8).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={(prod, v) => addToCart(prod, v)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <ProductMediaViewer product={product} open={viewerOpen} onClose={() => setViewerOpen(false)} />

      <Footer />
    </div>
  );
};

export default ProductDetail;
