import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import ProductCard from "@/components/products/ProductCard";
import CategoryIcon from "@/components/products/CategoryIcon";
import { Button } from "@/components/ui/button";
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
  saleStartsAt: p.sale_starts_at || null,
  saleEndsAt: p.sale_ends_at || null,
  stock: p.stock ?? 0,
  stockStatus: p.stock_status || 'active',
  backorderEtaDays: p.backorder_eta_days ?? null,
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
  const { addToCart, getCartItemCount } = useCart();
  const { data, isLoading: catsLoading } = useCategoryTree();

  const records = data?.records || [];
  const category = findBySlug(records, slug);
  const children = useMemo(
    () => records.filter((c) => category && c.parent_id === category.id),
    [records, category],
  );

  const scope: CategoryRecord[] = category ? [category, ...children] : [];

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["category-products", scope.map((c) => c.id)],
    enabled: scope.length > 0,
    staleTime: 60 * 1000,
    queryFn: () => fetchProductsForCategories(scope),
  });

  const handleAdd = (product: Product, variant?: any) => {
    addToCart(product, variant);
    toast.success(`${product.name} added to cart`);
  };

  if (catsLoading) return <CategorySkeleton cartItemCount={getCartItemCount()} />;

  // A subcategory URL visited at the old flat path: send it to its real home.
  if (category?.parent_id) {
    return <Navigate to={categoryPath(records, category)} replace />;
  }

  if (!category) return <CategoryMissing slug={slug} cartItemCount={getCartItemCount()} />;

  const { title, description } = metaFor(category, true);
  const url = `/category/${category.slug}`;
  const featured = products.slice(0, 8);

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.name,
      description,
      url: `${BASE_URL}${url}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: category.name,
      itemListElement: products.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/product/${p.slug || p.id}`,
        name: p.name,
      })),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <SEO
        title={title}
        description={description}
        canonicalUrl={url}
        structuredData={structuredData}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: category.name, url },
        ]}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        {/* EDITABLE CONTENT BLOCK - managed in Admin > Categories > Intro copy */}
        <header className="mb-8 max-w-3xl">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-2.5">
            <CategoryIcon name={category.icon} className="h-7 w-7 text-primary shrink-0" />
            {category.name}
          </h1>
          {category.intro_copy ? (
            <div className="mt-3 space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {category.intro_copy.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </header>

        {children.length > 0 && (
          <section aria-labelledby="browse-heading" className="mb-10">
            <h2 id="browse-heading" className="text-lg font-semibold mb-3">
              Browse {category.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {children.map((child) => (
                <Link
                  key={child.id}
                  to={`/category/${category.slug}/${child.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-background">
                    <CategoryIcon name={child.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-tight">{child.name}</span>
                    <span className="mt-0.5 flex items-center text-xs text-muted-foreground">
                      Shop now
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="popular-heading">
          <h2 id="popular-heading" className="text-lg font-semibold mb-3">
            {children.length > 0 ? `Popular in ${category.name}` : `All ${category.name}`}
          </h2>
          {productsLoading ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8">
              Nothing stocked here yet. WhatsApp us on +254 119 774470 and we'll source it.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {(children.length > 0 ? featured : products).map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export const ProductGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
    ))}
  </div>
);

export const CategorySkeleton = ({ cartItemCount }: { cartItemCount: number }) => (
  <div className="min-h-screen flex flex-col pb-16">
    <Header cartItemCount={cartItemCount} />
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 rounded bg-muted" />
        <div className="h-20 rounded bg-muted" />
      </div>
      <div className="mt-6">
        <ProductGridSkeleton />
      </div>
    </main>
    <Footer />
  </div>
);

export const CategoryMissing = ({ slug, cartItemCount }: { slug?: string; cartItemCount: number }) => (
  <div className="min-h-screen flex flex-col pb-16">
    <SEO
      title="Category not found"
      description="That category does not exist."
      canonicalUrl={`/category/${slug || ""}`}
      noindex
    />
    <Header cartItemCount={cartItemCount} />
    <main className="flex-1 container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Category not found</h1>
      <Link to="/">
        <Button>Back to shop</Button>
      </Link>
    </main>
    <Footer />
  </div>
);

export default CategoryLanding;
