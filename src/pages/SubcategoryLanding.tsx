import { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useCategoryTree } from "@/hooks/use-category-tree";
import { getEffectivePrice } from "@/components/products/SaleBadge";
import { BASE_URL, fetchProductsForCategories, findBySlug, metaFor } from "@/lib/categories";
import { Product } from "@/types/product";
import { CategoryMissing, CategorySkeleton, ProductGridSkeleton } from "./CategoryLanding";

const SubcategoryLanding = () => {
  const { parentSlug, slug } = useParams<{ parentSlug: string; slug: string }>();
  const { addToCart, getCartItemCount } = useCart();
  const { data, isLoading: catsLoading } = useCategoryTree();

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("popular");

  const records = data?.records || [];
  const category = findBySlug(records, slug);
  const parent = findBySlug(records, parentSlug);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["subcategory-products", category?.id],
    enabled: !!category,
    staleTime: 60 * 1000,
    queryFn: () => fetchProductsForCategories([category!]),
  });

  const visible = useMemo(() => {
    const priceOf = (p: Product) =>
      getEffectivePrice(p.price, p.originalPrice, p.saleStartsAt, p.saleEndsAt);
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    const list = products.filter((p) => {
      const price = priceOf(p);
      if (!Number.isNaN(min) && price < min) return false;
      if (!Number.isNaN(max) && price > max) return false;
      if (inStockOnly && (p.stock ?? 0) <= 0) return false;
      return true;
    });
    if (sortBy === "price-asc") return [...list].sort((a, b) => priceOf(a) - priceOf(b));
    if (sortBy === "price-desc") return [...list].sort((a, b) => priceOf(b) - priceOf(a));
    if (sortBy === "name-asc") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, minPrice, maxPrice, inStockOnly, sortBy]);

  const handleAdd = (product: Product, variant?: any) => {
    addToCart(product, variant);
    toast.success(`${product.name} added to cart`);
  };

  if (catsLoading) return <CategorySkeleton cartItemCount={getCartItemCount()} />;
  if (!category) return <CategoryMissing slug={slug} cartItemCount={getCartItemCount()} />;

  // Wrong or missing parent in the URL: normalise to the canonical path.
  const realParent = records.find((c) => c.id === category.parent_id) || null;
  if (!realParent) return <Navigate to={`/category/${category.slug}`} replace />;
  if (!parent || parent.id !== realParent.id) {
    return <Navigate to={`/category/${realParent.slug}/${category.slug}`} replace />;
  }

  const { title, description } = metaFor(category, false);
  const url = `/category/${realParent.slug}/${category.slug}`;

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
          { name: realParent.name, url: `/category/${realParent.slug}` },
          { name: category.name, url },
        ]}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <Link to={`/category/${realParent.slug}`} className="hover:text-primary">{realParent.name}</Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        {/* EDITABLE CONTENT BLOCK - managed in Admin > Categories > Intro copy */}
        <header className="mb-6 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <CategoryIcon name={category.icon} className="h-6 w-6 text-primary shrink-0" />
            {category.name}
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
            {category.intro_copy || description}
          </p>
        </header>

        <section aria-label="Filters" className="mb-5 rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div>
              <Label htmlFor="min-price" className="text-xs">Min price (KSh)</Label>
              <Input
                id="min-price"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="max-price" className="text-xs">Max price (KSh)</Label>
              <Input
                id="max-price"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sort-by" className="text-xs">Sort</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 h-9">
              <Checkbox
                id="in-stock"
                checked={inStockOnly}
                onCheckedChange={(v) => setInStockOnly(v === true)}
              />
              <Label htmlFor="in-stock" className="text-sm font-normal">In stock only</Label>
            </div>
          </div>
        </section>

        {productsLoading ? (
          <ProductGridSkeleton />
        ) : visible.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Nothing matches those filters.</p>
            <Button
              variant="outline"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
                setInStockOnly(false);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {visible.length} {visible.length === 1 ? "item" : "items"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {visible.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SubcategoryLanding;
