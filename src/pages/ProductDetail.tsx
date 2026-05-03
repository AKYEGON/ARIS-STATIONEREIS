import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import ProductCard from "@/components/products/ProductCard";
import ProductMediaViewer from "@/components/products/ProductMediaViewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart, ChevronRight, Truck, Tag, Phone } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = "https://arisstationaries.co.ke";

const formatProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  category: p.category,
  image: p.image,
  is_featured: p.is_featured,
  display_order: p.display_order,
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
  const [product, setProduct] = useState<Product | null>(null);
  const [productSlug, setProductSlug] = useState<string>("");
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      setNotFound(false);

      // Fetch by slug (single)
      const { data, error } = await supabase
        .from("products")
        .select(`*, media:product_media(*), variants:product_variants(*)`)
        .eq("slug", slug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const formatted = formatProduct(data);
      setProduct(formatted);
      setProductSlug((data as any).slug);
      setSelectedVariant(undefined);

      // Related: same category, exclude self, limit 4
      const { data: rel } = await supabase
        .from("products")
        .select(`*, media:product_media(*), variants:product_variants(*)`)
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(4);
      setRelated((rel || []).map(formatProduct));

      setLoading(false);
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  const displayPrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const hasDiscount =
    !selectedVariant && product?.originalPrice && product.originalPrice > product.price;

  const variantGroups = useMemo(() => {
    if (!product?.variants) return {};
    return product.variants.reduce<Record<string, ProductVariant[]>>((acc, v) => {
      if (!acc[v.variant_type]) acc[v.variant_type] = [];
      acc[v.variant_type].push(v);
      return acc;
    }, {});
  }, [product]);

  // SEO data
  const seoData = useMemo(() => {
    if (!product) return null;
    const priceFmt = displayPrice.toLocaleString("en-KE", { maximumFractionDigits: 0 });
    const title = `${product.name} | Buy Cheap ${product.category} in Kenya — KSh ${priceFmt}`;
    const description = `Buy ${product.name} at the best price in Kenya — KSh ${priceFmt}. Fast delivery to University of Nairobi, Kenyatta University, Strathmore, USIU and nationwide. Order at arisstationaries.co.ke`;
    const url = `/product/${productSlug}`;
    const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      image: product.image.startsWith("http") ? product.image : `${BASE_URL}${product.image}`,
      description: product.description?.slice(0, 160) || description.slice(0, 160),
      sku: product.id,
      brand: { "@type": "Brand", name: "Aris Stationeries" },
      category: product.category,
      offers: {
        "@type": "Offer",
        url: `${BASE_URL}${url}`,
        priceCurrency: "KES",
        price: displayPrice.toFixed(0),
        priceValidUntil: validUntil,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "Aris Stationeries" },
      },
    };

    return { title, description, url, schema: productSchema };
  }, [product, displayPrice, productSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading product…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <SEO
          title="Product Not Found | Aris Stationeries"
          description="The product you are looking for is no longer available. Browse all stationery at Aris Stationeries Kenya."
          noindex
        />
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-3">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This product may have been removed or the link is incorrect.
          </p>
          <Button onClick={() => navigate("/")}>Back to Shop</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAdd = () => {
    addToCart(product, selectedVariant);
    toast.success("Added to cart");
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      {seoData && (
        <SEO
          title={seoData.title}
          description={seoData.description}
          canonicalUrl={seoData.url}
          ogType="product"
          ogImage={product.image}
          structuredData={seoData.schema}
          breadcrumbs={[
            { name: "Home", url: "/" },
            { name: product.category, url: `/?category=${encodeURIComponent(product.category)}` },
            { name: product.name, url: seoData.url },
          ]}
        />
      )}

      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Breadcrumbs (visible) */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs sm:text-sm text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap"
        >
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            to={`/?category=${encodeURIComponent(product.category)}`}
            className="hover:text-primary"
          >
            {product.category}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 mb-10">
          {/* Image */}
          <Card
            className="bg-white p-4 sm:p-6 flex items-center justify-center cursor-pointer aspect-square overflow-hidden"
            onClick={() => product.media && product.media.length > 0 && setViewerOpen(true)}
          >
            <img
              src={product.image}
              alt={`${product.name} — Buy Affordable ${product.category} in Kenya | Aris Stationeries`}
              className="max-h-full max-w-full object-contain"
              loading="eager"
            />
          </Card>

          {/* Info */}
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight mb-2">
              Buy {product.name} in Kenya — KSh {displayPrice.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              <Tag className="inline h-3.5 w-3.5 mr-1" />
              {product.category}
            </p>

            {/* Price block */}
            <div className="mb-4">
              {hasDiscount ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-primary">
                    KSh {displayPrice.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-base text-muted-foreground line-through">
                    KSh {product.originalPrice!.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  KSh {displayPrice.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {/* Variants */}
            {Object.entries(variantGroups).map(([type, variants]) => (
              <div key={type} className="mb-4">
                <p className="text-sm font-medium mb-2">{type}</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setSelectedVariant(selectedVariant?.id === v.id ? undefined : v)
                      }
                      className={`text-xs px-3 py-1.5 rounded border transition-all ${
                        selectedVariant?.id === v.id
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {v.variant_value}
                      <span className="ml-1 opacity-70">KSh {v.price.toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <Button
              size="lg"
              className="w-full sm:w-auto sm:min-w-[240px] mb-6"
              onClick={handleAdd}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* SEO content blocks */}
        <article className="prose prose-sm max-w-none mb-10 space-y-6">
          <section>
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              Why Buy {product.name} from Aris Stationeries?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At Aris Stationeries we make {product.name.toLowerCase()} affordable for every
              university student and professional in Kenya. Whether you study at the University
              of Nairobi, Kenyatta University, Strathmore University, USIU or any other campus,
              we stock genuine {product.category.toLowerCase()} at prices that beat campus
              bookshops and major retailers. Every product is carefully sourced for quality and
              ready for fast dispatch from our Nairobi base.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              {product.name} Price in Kenya
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The current price of {product.name} at Aris Stationeries is{" "}
              <strong className="text-foreground">
                KSh {displayPrice.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
              </strong>
              {hasDiscount && (
                <>
                  {" "}— down from KSh{" "}
                  {product.originalPrice!.toLocaleString("en-KE", { maximumFractionDigits: 0 })}
                </>
              )}
              . We benchmark our {product.category.toLowerCase()} prices weekly against shops
              around Nairobi CBD and major university campuses to keep our prices the most
              affordable in Kenya. Order online and skip the queues.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery — Get Your {product.name} Anywhere in Kenya
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We deliver {product.name} to the University of Nairobi (Main Campus, Kikuyu, Chiromo,
              Lower Kabete), Kenyatta University, Strathmore University, USIU and other campuses
              across Nairobi. Nationwide delivery is also available to Mombasa, Kisumu, Nakuru,
              Eldoret and beyond via courier. For urgent orders or bulk enquiries, reach us on
              WhatsApp at <a href="https://wa.me/254119774470" className="text-primary inline-flex items-center gap-1"><Phone className="h-3 w-3" />+254 119 774 470</a>.
            </p>
          </section>
        </article>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </section>
        )}

        <div className="text-center">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Browse all stationery
          </Link>
        </div>
      </main>

      <Footer />

      <ProductMediaViewer
        product={product}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;
