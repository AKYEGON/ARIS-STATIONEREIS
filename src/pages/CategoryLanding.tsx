import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { ChevronRight, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

const BASE_URL = "https://arisstationaries.co.ke";

const formatProduct = (p: any): Product & { slug?: string } => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
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

const CategoryLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemCount } = useCart();
  const [category, setCategory] = useState<CategoryRow | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    try {
      const { data: cats } = await supabase
        .from("product_categories")
        .select("id,name,slug,icon,is_active,display_order")
        .eq("is_active", true)
        .order("display_order");
      setAllCategories((cats || []) as CategoryRow[]);

      const cat = (cats || []).find((c: any) => c.slug === slug);
      if (!cat) {
        setNotFound(true);
        return;
      }
      setCategory(cat as CategoryRow);

      // Fetch products: union of (a) products.category text == name, (b) M2M assignments
      const [{ data: byText }, { data: assignments }] = await Promise.all([
        supabase
          .from("products")
          .select(`*, media:product_media(*), variants:product_variants(*)`)
          .eq("category", cat.name),
        supabase
          .from("product_category_assignments")
          .select("product_id")
          .eq("category_id", cat.id),
      ]);

      const assignedIds = (assignments || []).map((a: any) => a.product_id);
      let byAssign: any[] = [];
      if (assignedIds.length > 0) {
        const { data } = await supabase
          .from("products")
          .select(`*, media:product_media(*), variants:product_variants(*)`)
          .in("id", assignedIds);
        byAssign = data || [];
      }

      const seen = new Set<string>();
      const merged: any[] = [];
      [...(byText || []), ...byAssign].forEach((p) => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          merged.push(p);
        }
      });

      merged.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
        return (a.display_order || 0) - (b.display_order || 0);
      });

      setProducts(merged.map(formatProduct));
    } catch (err) {
      console.error("Error loading category:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (product: Product, variant?: any) => {
    addToCart(product, variant);
    toast.success(`${product.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted w-2/3 rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <SEO
          title="Category Not Found"
          description="The category you are looking for does not exist."
          canonicalUrl={`/category/${slug}`}
          noindex
        />
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Button onClick={() => navigate("/")}>Back to shop</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const title = `${category.name} in Kenya — Buy Online`;
  const description = `Shop ${category.name.toLowerCase()} at Aris Stationeries Nairobi. Affordable prices, fast delivery countrywide, and trusted by students across UoN, Kenyatta, Strathmore, JKUAT and USIU. ${products.length} products available.`;

  const intro = `Looking for ${category.name.toLowerCase()} in Kenya? Aris Stationeries stocks a curated range trusted by university students, professionals and offices across Nairobi and countrywide. From entry-level essentials to premium picks, every item is priced for student budgets and delivered fast. Browse the full ${category.name.toLowerCase()} collection below, or chat with us on WhatsApp at +254 119 774470 for recommendations, bulk pricing or campus pickup at UoN, Kenyatta University, Strathmore, JKUAT and USIU.`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.name} | Aris Stationeries`,
      description,
      url: `${BASE_URL}/category/${category.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/product/${(p as any).slug || p.id}`,
        name: p.name,
      })),
    },
  ];

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: category.name, url: `/category/${category.slug}` },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <SEO
        title={title}
        description={description}
        canonicalUrl={`/category/${category.slug}`}
        structuredData={structuredData}
        breadcrumbs={breadcrumbs}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-6">
        <nav className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {category.name} in Kenya
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {intro}
          </p>
        </header>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products in this category yet.</p>
            <Button onClick={() => navigate("/")}>Browse all products</Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3">
              {products.length} {products.length === 1 ? "product" : "products"} available
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />
              ))}
            </div>
          </>
        )}

        {allCategories.length > 1 && (
          <section className="mt-10 pt-6 border-t">
            <h2 className="text-lg font-semibold mb-3">Browse other categories</h2>
            <div className="flex flex-wrap gap-2">
              {allCategories
                .filter((c) => c.slug !== category.slug)
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-secondary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryLanding;
