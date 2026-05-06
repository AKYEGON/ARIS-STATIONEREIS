(product as any).slug || slugimport { useEffect, useState, useCallback } from "react";
(product as any).slug || slugimport { useParams, Link, useNavigate } from "react-router-dom";
(product as any).slug || slugimport { supabase } from "@/integrations/supabase/client";
(product as any).slug || slugimport { Product, ProductVariant } from "@/types/product";
(product as any).slug || slugimport Header from "@/components/layout/Header";
(product as any).slug || slugimport Footer from "@/components/layout/Footer";
(product as any).slug || slugimport SEO from "@/components/common/SEO";
(product as any).slug || slugimport ProductCard from "@/components/products/ProductCard";
(product as any).slug || slugimport ProductMediaViewer from "@/components/products/ProductMediaViewer";
(product as any).slug || slugimport { Button } from "@/components/ui/button";
(product as any).slug || slugimport { Card } from "@/components/ui/card";
(product as any).slug || slugimport { ShoppingCart, ChevronRight, Truck, ShieldCheck, Phone, Images } from "lucide-react";
(product as any).slug || slugimport { useCart } from "@/contexts/CartContext";
(product as any).slug || slugimport { toast } from "sonner";
(product as any).slug || slug
(product as any).slug || slugtype ProductWithSlug = Product & { slug?: string };
(product as any).slug || slug
(product as any).slug || slugconst formatProduct = (p: any): Product => ({
(product as any).slug || slug  id: p.id,
(product as any).slug || slug  name: p.name,
(product as any).slug || slug  description: p.description || "",
(product as any).slug || slug  price: Number(p.price),
(product as any).slug || slug  originalPrice: p.original_price ? Number(p.original_price) : undefined,
(product as any).slug || slug  category: p.category,
(product as any).slug || slug  image: p.image,
(product as any).slug || slug  is_featured: p.is_featured,
(product as any).slug || slug  display_order: p.display_order,
(product as any).slug || slug  media: ((p as any).media || []).map((m: any) => ({
(product as any).slug || slug    ...m,
(product as any).slug || slug    media_type: m.media_type as "image" | "video",
(product as any).slug || slug  })),
(product as any).slug || slug  variants: ((p as any).variants || [])
(product as any).slug || slug    .filter((v: any) => v.is_active)
(product as any).slug || slug    .map((v: any) => ({
(product as any).slug || slug      ...v,
(product as any).slug || slug      price: Number(v.price),
(product as any).slug || slug      cost_price: Number(v.cost_price),
(product as any).slug || slug    })),
(product as any).slug || slug});
(product as any).slug || slug
(product as any).slug || slugconst ProductDetail = () => {
(product as any).slug || slug  const { slug } = useParams<{ slug: string }>();
(product as any).slug || slug  const navigate = useNavigate();
(product as any).slug || slug  const { addToCart, getCartItemCount } = useCart();
(product as any).slug || slug  const [product, setProduct] = useState<Product | null>(null);
(product as any).slug || slug  const [related, setRelated] = useState<Product[]>([]);
(product as any).slug || slug  const [loading, setLoading] = useState(true);
(product as any).slug || slug  const [notFound, setNotFound] = useState(false);
(product as any).slug || slug  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
(product as any).slug || slug  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
(product as any).slug || slug  const [viewerOpen, setViewerOpen] = useState(false);
(product as any).slug || slug
(product as any).slug || slug  const fetchProduct = useCallback(async () => {
(product as any).slug || slug    if (!slug) return;
(product as any).slug || slug    setLoading(true);
(product as any).slug || slug    setNotFound(false);
(product as any).slug || slug    try {
(product as any).slug || slug      const { data, error } = await supabase
(product as any).slug || slug        .from("products")
(product as any).slug || slug        .select(`*, media:product_media(*), variants:product_variants(*)`)
(product as any).slug || slug        .eq("slug", slug)
(product as any).slug || slug        .maybeSingle();
(product as any).slug || slug
(product as any).slug || slug      if (error) throw error;
(product as any).slug || slug      if (!data) {
(product as any).slug || slug        setNotFound(true);
(product as any).slug || slug        setProduct(null);
(product as any).slug || slug        return;
(product as any).slug || slug      }
(product as any).slug || slug      const p = formatProduct(data);
(product as any).slug || slug      setProduct(p);
(product as any).slug || slug      setSelectedVariant(undefined);
(product as any).slug || slug      setActiveMediaIndex(0);
(product as any).slug || slug
(product as any).slug || slug      // Fetch related products in same category
(product as any).slug || slug      const { data: relData } = await supabase
(product as any).slug || slug        .from("products")
(product as any).slug || slug        .select(`*, media:product_media(*), variants:product_variants(*)`)
(product as any).slug || slug        .eq("category", p.category)
(product as any).slug || slug        .neq("id", p.id)
(product as any).slug || slug        .limit(8);
(product as any).slug || slug      setRelated((relData || []).map(formatProduct));
(product as any).slug || slug    } catch (err) {
(product as any).slug || slug      console.error("Error fetching product:", err);
(product as any).slug || slug      setNotFound(true);
(product as any).slug || slug    } finally {
(product as any).slug || slug      setLoading(false);
(product as any).slug || slug    }
(product as any).slug || slug  }, [slug]);
(product as any).slug || slug
(product as any).slug || slug  useEffect(() => {
(product as any).slug || slug    fetchProduct();
(product as any).slug || slug  }, [fetchProduct]);
(product as any).slug || slug
(product as any).slug || slug  if (loading) {
(product as any).slug || slug    return (
(product as any).slug || slug      <div className="min-h-screen flex flex-col">
(product as any).slug || slug        <Header cartItemCount={getCartItemCount()} />
(product as any).slug || slug        <main className="flex-1 container mx-auto px-4 py-8">
(product as any).slug || slug          <div className="animate-pulse space-y-4">
(product as any).slug || slug            <div className="h-6 bg-muted w-1/3 rounded" />
(product as any).slug || slug            <div className="grid md:grid-cols-2 gap-8">
(product as any).slug || slug              <div className="aspect-square bg-muted rounded-lg" />
(product as any).slug || slug              <div className="space-y-3">
(product as any).slug || slug                <div className="h-8 bg-muted rounded w-3/4" />
(product as any).slug || slug                <div className="h-6 bg-muted rounded w-1/4" />
(product as any).slug || slug                <div className="h-20 bg-muted rounded" />
(product as any).slug || slug              </div>
(product as any).slug || slug            </div>
(product as any).slug || slug          </div>
(product as any).slug || slug        </main>
(product as any).slug || slug        <Footer />
(product as any).slug || slug      </div>
(product as any).slug || slug    );
(product as any).slug || slug  }
(product as any).slug || slug
(product as any).slug || slug  if (notFound || !product) {
(product as any).slug || slug    return (
(product as any).slug || slug      <div className="min-h-screen flex flex-col">
(product as any).slug || slug        <SEO title="Product Not Found" description="The product you are looking for could not be found." canonicalUrl={`/product/${slug}`} noindex />
(product as any).slug || slug        <Header cartItemCount={getCartItemCount()} />
(product as any).slug || slug        <main className="flex-1 container mx-auto px-4 py-16 text-center">
(product as any).slug || slug          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
(product as any).slug || slug          <p className="text-muted-foreground mb-6">This product may have been removed or the link is incorrect.</p>
(product as any).slug || slug          <Button onClick={() => navigate("/")}>Back to shop</Button>
(product as any).slug || slug        </main>
(product as any).slug || slug        <Footer />
(product as any).slug || slug      </div>
(product as any).slug || slug    );
(product as any).slug || slug  }
(product as any).slug || slug
(product as any).slug || slug  const hasVariants = !!(product.variants && product.variants.length > 0);
(product as any).slug || slug  const variantGroups = hasVariants
(product as any).slug || slug    ? product.variants!.reduce<Record<string, ProductVariant[]>>((acc, v) => {
(product as any).slug || slug        if (!acc[v.variant_type]) acc[v.variant_type] = [];
(product as any).slug || slug        acc[v.variant_type].push(v);
(product as any).slug || slug        return acc;
(product as any).slug || slug      }, {})
(product as any).slug || slug    : {};
(product as any).slug || slug
(product as any).slug || slug  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
(product as any).slug || slug  const allMedia = [
(product as any).slug || slug    { type: "image" as const, url: product.image },
(product as any).slug || slug    ...(product.media?.map((m) => ({ type: m.media_type, url: m.media_url })) || []),
(product as any).slug || slug  ];
(product as any).slug || slug  const activeMedia = allMedia[activeMediaIndex] || allMedia[0];
(product as any).slug || slug
(product as any).slug || slug  const productUrl = `/product/${product.slug || slug}`;
(product as any).slug || slug  const fullUrl = `https://arisstationaries.co.ke${productUrl}`;
(product as any).slug || slug  const fullImage = product.image.startsWith("http") ? product.image : `https://arisstationaries.co.ke${product.image}`;
(product as any).slug || slug
(product as any).slug || slug  const seoTitle = `Buy ${product.name} in Kenya — KSh ${displayPrice.toFixed(0)} | Aris Stationeries`.slice(0, 70);
(product as any).slug || slug  const seoDescription = `${product.name} available at Aris Stationeries Kenya for KSh ${displayPrice.toFixed(0)}. ${product.description || "Affordable stationery"} — delivered to your university or doorstep across Kenya.`.slice(0, 160);
(product as any).slug || slug
(product as any).slug || slug  const productSchema = {
(product as any).slug || slug    "@context": "https://schema.org",
(product as any).slug || slug    "@type": "Product",
(product as any).slug || slug    name: product.name,
(product as any).slug || slug    description: product.description,
(product as any).slug || slug    image: fullImage,
(product as any).slug || slug    sku: product.id,
(product as any).slug || slug    category: product.category,
(product as any).slug || slug    brand: { "@type": "Brand", name: "ARIS STATIONERIES" },
(product as any).slug || slug    offers: {
(product as any).slug || slug      "@type": "Offer",
(product as any).slug || slug      url: fullUrl,
(product as any).slug || slug      priceCurrency: "KES",
(product as any).slug || slug      price: displayPrice,
(product as any).slug || slug      availability: "https://schema.org/InStock",
(product as any).slug || slug      seller: { "@type": "Organization", name: "ARIS STATIONERIES" },
(product as any).slug || slug      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
(product as any).slug || slug    },
(product as any).slug || slug  };
(product as any).slug || slug
(product as any).slug || slug  const handleAddToCart = () => {
(product as any).slug || slug    if (hasVariants && !selectedVariant) {
(product as any).slug || slug      toast.error("Please select an option first");
(product as any).slug || slug      return;
(product as any).slug || slug    }
(product as any).slug || slug    addToCart(product, selectedVariant);
(product as any).slug || slug  };
(product as any).slug || slug
(product as any).slug || slug  return (
(product as any).slug || slug    <div className="min-h-screen flex flex-col bg-background">
(product as any).slug || slug      <SEO
(product as any).slug || slug        title={seoTitle}
(product as any).slug || slug        description={seoDescription}
(product as any).slug || slug        canonicalUrl={productUrl}
(product as any).slug || slug        ogImage={fullImage}
(product as any).slug || slug        ogType="product"
(product as any).slug || slug        keywords={`${product.name}, ${product.category}, buy ${product.name} Kenya, ${product.name} price Kenya, Aris Stationeries`}
(product as any).slug || slug        structuredData={productSchema}
(product as any).slug || slug        breadcrumbs={[
(product as any).slug || slug          { name: "Home", url: "/" },
(product as any).slug || slug          { name: product.category, url: `/?category=${encodeURIComponent(product.category)}` },
(product as any).slug || slug          { name: product.name, url: productUrl },
(product as any).slug || slug        ]}
(product as any).slug || slug      />
(product as any).slug || slug
(product as any).slug || slug      <Header cartItemCount={getCartItemCount()} />
(product as any).slug || slug
(product as any).slug || slug      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20">
(product as any).slug || slug        {/* Breadcrumbs */}
(product as any).slug || slug        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap">
(product as any).slug || slug          <Link to="/" className="hover:text-primary">Home</Link>
(product as any).slug || slug          <ChevronRight className="h-3 w-3" />
(product as any).slug || slug          <span className="hover:text-primary">{product.category}</span>
(product as any).slug || slug          <ChevronRight className="h-3 w-3" />
(product as any).slug || slug          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
(product as any).slug || slug        </nav>
(product as any).slug || slug
(product as any).slug || slug        {/* Main product layout */}
(product as any).slug || slug        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 mb-10">
(product as any).slug || slug          {/* Image column */}
(product as any).slug || slug          <div className="space-y-3">
(product as any).slug || slug            <Card
(product as any).slug || slug              className="aspect-square bg-white flex items-center justify-center cursor-zoom-in relative overflow-hidden"
(product as any).slug || slug              onClick={() => setViewerOpen(true)}
(product as any).slug || slug            >
(product as any).slug || slug              {activeMedia.type === "image" ? (
(product as any).slug || slug                <img
(product as any).slug || slug                  src={activeMedia.url}
(product as any).slug || slug                  alt={`${product.name} - ${product.description} - Buy at ARIS STATIONERIES Kenya`}
(product as any).slug || slug                  className="max-h-full max-w-full object-contain p-4"
(product as any).slug || slug                />
(product as any).slug || slug              ) : (
(product as any).slug || slug                <video src={activeMedia.url} className="max-h-full max-w-full" controls />
(product as any).slug || slug              )}
(product as any).slug || slug              {allMedia.length > 1 && (
(product as any).slug || slug                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
(product as any).slug || slug                  <Images className="h-3 w-3" />
(product as any).slug || slug                  <span>{allMedia.length}</span>
(product as any).slug || slug                </div>
(product as any).slug || slug              )}
(product as any).slug || slug            </Card>
(product as any).slug || slug
(product as any).slug || slug            {/* Thumbnails */}
(product as any).slug || slug            {allMedia.length > 1 && (
(product as any).slug || slug              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
(product as any).slug || slug                {allMedia.map((m, i) => (
(product as any).slug || slug                  <button
(product as any).slug || slug                    key={i}
(product as any).slug || slug                    onClick={() => setActiveMediaIndex(i)}
(product as any).slug || slug                    className={`flex-shrink-0 w-16 h-16 rounded-md border-2 bg-white overflow-hidden transition-all ${
(product as any).slug || slug                      i === activeMediaIndex ? "border-primary" : "border-border opacity-70 hover:opacity-100"
(product as any).slug || slug                    }`}
(product as any).slug || slug                  >
(product as any).slug || slug                    {m.type === "image" ? (
(product as any).slug || slug                      <img src={m.url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-contain p-1" />
(product as any).slug || slug                    ) : (
(product as any).slug || slug                      <div className="w-full h-full flex items-center justify-center text-xs">▶</div>
(product as any).slug || slug                    )}
(product as any).slug || slug                  </button>
(product as any).slug || slug                ))}
(product as any).slug || slug              </div>
(product as any).slug || slug            )}
(product as any).slug || slug          </div>
(product as any).slug || slug
(product as any).slug || slug          {/* Info column */}
(product as any).slug || slug          <div className="space-y-4">
(product as any).slug || slug            <div>
(product as any).slug || slug              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{product.category}</p>
(product as any).slug || slug              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{product.name}</h1>
(product as any).slug || slug            </div>
(product as any).slug || slug
(product as any).slug || slug            {/* Price */}
(product as any).slug || slug            <div className="flex items-baseline gap-3">
(product as any).slug || slug              <span className="text-2xl sm:text-3xl font-bold text-primary">KSh {displayPrice.toFixed(0)}</span>
(product as any).slug || slug              {!selectedVariant && product.originalPrice && product.originalPrice > product.price && (
(product as any).slug || slug                <span className="text-base text-muted-foreground line-through">
(product as any).slug || slug                  KSh {product.originalPrice.toFixed(0)}
(product as any).slug || slug                </span>
(product as any).slug || slug              )}
(product as any).slug || slug              {!selectedVariant && product.originalPrice && product.originalPrice > product.price && (
(product as any).slug || slug                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
(product as any).slug || slug                  Save KSh {(product.originalPrice - product.price).toFixed(0)}
(product as any).slug || slug                </span>
(product as any).slug || slug              )}
(product as any).slug || slug            </div>
(product as any).slug || slug
(product as any).slug || slug            {/* Description */}
(product as any).slug || slug            {product.description && (
(product as any).slug || slug              <div>
(product as any).slug || slug                <h2 className="text-sm font-semibold mb-1">Description</h2>
(product as any).slug || slug                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
(product as any).slug || slug              </div>
(product as any).slug || slug            )}
(product as any).slug || slug
(product as any).slug || slug            {/* Variants */}
(product as any).slug || slug            {hasVariants &&
(product as any).slug || slug              Object.entries(variantGroups).map(([type, variants]) => (
(product as any).slug || slug                <div key={type}>
(product as any).slug || slug                  <p className="text-sm font-semibold mb-2">
(product as any).slug || slug                    {type} {!selectedVariant && <span className="text-destructive font-normal">*required</span>}
(product as any).slug || slug                  </p>
(product as any).slug || slug                  <div className="flex flex-wrap gap-2">
(product as any).slug || slug                    {variants.map((v) => (
(product as any).slug || slug                      <button
(product as any).slug || slug                        key={v.id}
(product as any).slug || slug                        type="button"
(product as any).slug || slug                        onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? undefined : v)}
(product as any).slug || slug                        className={`text-sm px-3 py-2 rounded-md border transition-all ${
(product as any).slug || slug                          selectedVariant?.id === v.id
(product as any).slug || slug                            ? "border-primary bg-primary/10 text-primary font-semibold"
(product as any).slug || slug                            : "border-border hover:border-primary/50"
(product as any).slug || slug                        }`}
(product as any).slug || slug                      >
(product as any).slug || slug                        {v.variant_value}
(product as any).slug || slug                        <span className="ml-1.5 opacity-70 text-xs">KSh {v.price.toFixed(0)}</span>
(product as any).slug || slug                      </button>
(product as any).slug || slug                    ))}
(product as any).slug || slug                  </div>
(product as any).slug || slug                </div>
(product as any).slug || slug              ))}
(product as any).slug || slug
(product as any).slug || slug            {/* CTA */}
(product as any).slug || slug            <Button size="lg" className="w-full h-12 text-base" onClick={handleAddToCart}>
(product as any).slug || slug              <ShoppingCart className="mr-2 h-5 w-5" />
(product as any).slug || slug              {hasVariants && !selectedVariant ? "Select Option" : "Add to Cart"}
(product as any).slug || slug            </Button>
(product as any).slug || slug
(product as any).slug || slug            {/* Trust strip */}
(product as any).slug || slug            <div className="grid grid-cols-3 gap-2 pt-3 border-t">
(product as any).slug || slug              <div className="flex flex-col items-center text-center gap-1 p-2">
(product as any).slug || slug                <Truck className="h-5 w-5 text-primary" />
(product as any).slug || slug                <span className="text-[10px] sm:text-xs text-muted-foreground">Nationwide Delivery</span>
(product as any).slug || slug              </div>
(product as any).slug || slug              <div className="flex flex-col items-center text-center gap-1 p-2">
(product as any).slug || slug                <ShieldCheck className="h-5 w-5 text-primary" />
(product as any).slug || slug                <span className="text-[10px] sm:text-xs text-muted-foreground">Genuine Stationery</span>
(product as any).slug || slug              </div>
(product as any).slug || slug              <div className="flex flex-col items-center text-center gap-1 p-2">
(product as any).slug || slug                <Phone className="h-5 w-5 text-primary" />
(product as any).slug || slug                <a href="tel:+254119774470" className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary">
(product as any).slug || slug                  +254 119 774 470
(product as any).slug || slug                </a>
(product as any).slug || slug              </div>
(product as any).slug || slug            </div>
(product as any).slug || slug          </div>
(product as any).slug || slug        </div>
(product as any).slug || slug
(product as any).slug || slug        {/* Related products */}
(product as any).slug || slug        {related.length > 0 && (
(product as any).slug || slug          <section className="pt-6 border-t">
(product as any).slug || slug            <h2 className="text-lg sm:text-xl font-bold mb-4">You may also like</h2>
(product as any).slug || slug            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
(product as any).slug || slug              {related.slice(0, 8).map((p) => (
(product as any).slug || slug                <ProductCard key={p.id} product={p} onAddToCart={(prod, v) => addToCart(prod, v)} />
(product as any).slug || slug              ))}
(product as any).slug || slug            </div>
(product as any).slug || slug          </section>
(product as any).slug || slug        )}
(product as any).slug || slug      </main>
(product as any).slug || slug
(product as any).slug || slug      <ProductMediaViewer product={product} open={viewerOpen} onClose={() => setViewerOpen(false)} />
(product as any).slug || slug
(product as any).slug || slug      <Footer />
(product as any).slug || slug    </div>
(product as any).slug || slug  );
(product as any).slug || slug};
(product as any).slug || slug
(product as any).slug || slugexport default ProductDetail;
