import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductVariant } from "@/types/product";
import { smartMatch } from "@/lib/smart-search";
import { useCategoryTree, CategoryNode } from "@/hooks/use-category-tree";
import { getCategoryIcon, IconArrowRight } from "@/components/icons/aris-icons";
import { getEffectivePrice, isOnSale } from "@/components/products/SaleBadge";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const PER_PAGE = 24;

const formatProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price ?? 0),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  saleStartsAt: p.sale_starts_at || null,
  saleEndsAt: p.sale_ends_at || null,
  category: p.category,
  image: p.image,
  is_featured: p.is_featured,
  display_order: p.display_order,
  slug: p.slug,
  media: (p.media || []).map((m: any) => ({ ...m, media_type: m.media_type as "image" | "video" })),
  variants: (p.variants || [])
    .filter((v: any) => v.is_active)
    .map((v: any) => ({ ...v, price: Number(v.price ?? 0) })),
});

const Shop = () => {
  const { addToCart, getCartItemCount } = useCart();
  const { tree, all, loading: catsLoading } = useCategoryTree();
  const [params, setParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({}); // categoryId -> productIds
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get("q") || "";
  const categorySlug = params.get("category") || "";
  const subSlug = params.get("sub") || "";
  const sort = params.get("sort") || "featured";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "category") next.delete("sub");
    setParams(next, { replace: false });
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [prodRes, assignRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, media:product_media(*), variants:product_variants(*)")
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("product_category_assignments").select("category_id,product_id"),
    ]);

    const map: Record<string, string[]> = {};
    (assignRes.data || []).forEach((a: any) => {
      (map[a.category_id] ||= []).push(a.product_id);
    });
    setAssignments(map);
    setProducts((prodRes.data || []).map(formatProduct));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeMain: CategoryNode | undefined = tree.find((m) => m.slug === categorySlug);
  const activeSub: CategoryNode | undefined = activeMain?.children.find((c) => c.slug === subSlug);

  /** Product ids belonging to a category, counting its subcategories too. */
  const idsFor = useCallback(
    (node?: CategoryNode) => {
      if (!node) return null;
      const nodes = [node, ...node.children];
      const ids = new Set<string>();
      nodes.forEach((n) => {
        (assignments[n.id] || []).forEach((id) => ids.add(id));
        products.forEach((p) => {
          if (p.category && p.category.toLowerCase() === n.name.toLowerCase()) ids.add(p.id);
        });
      });
      return ids;
    },
    [assignments, products],
  );

  const filtered = useMemo(() => {
    const scope = idsFor(activeSub || activeMain);
    let list = scope ? products.filter((p) => scope.has(p.id)) : products;

    if (q.trim()) {
      list = list.filter((p) => smartMatch(q, [p.name, p.description, p.category]));
    }

    const price = (p: Product) =>
      getEffectivePrice(p.price, p.originalPrice, p.saleStartsAt, p.saleEndsAt);

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
    else if (sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "discount")
      sorted.sort((a, b) => {
        const d = (p: Product) =>
          isOnSale(p.price, p.originalPrice, p.saleStartsAt, p.saleEndsAt) && p.originalPrice
            ? 1 - p.price / p.originalPrice
            : 0;
        return d(b) - d(a);
      });
    return sorted;
  }, [products, q, sort, activeMain, activeSub, idsFor]);

  const countFor = useCallback((node: CategoryNode) => idsFor(node)?.size ?? 0, [idsFor]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [q, categorySlug, subSlug, sort]);

  const heading = activeSub?.name || activeMain?.name || "Everything in stock";

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <SEO
        title="Browse every ARIS product | ARIS"
        description="Filter the full ARIS catalogue by department and section: course equipment, stationery, art supplies, office and gifts. Nairobi same-day, countrywide in 48 hours."
        canonicalUrl="/shop"
        noindex
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="container flex-1 px-4 py-5 sm:py-7">
        {/* Breadcrumbs reflect the same taxonomy as the category pages */}
        <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shop" className="hover:text-primary">
            Shop
          </Link>
          {activeMain && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/shop?category=${activeMain.slug}`} className="hover:text-primary">
                {activeMain.name}
              </Link>
            </>
          )}
          {activeSub && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-foreground">{activeSub.name}</span>
            </>
          )}
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Counting stock..."
                : `${filtered.length} ${filtered.length === 1 ? "product" : "products"}${
                    q ? ` matching "${q}"` : ""
                  }`}
            </p>
          </div>

          <Select value={sort} onValueChange={(v) => setParam("sort", v === "featured" ? null : v)}>
            <SelectTrigger className="h-9 w-[190px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured first</SelectItem>
              <SelectItem value="discount">Biggest discount</SelectItem>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="name">Name A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile / tablet filter drawer, real sidebar from lg up */}
        <div className="mt-4 lg:hidden">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 w-full justify-between">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeSub?.name || activeMain?.name || "All departments"}
                </span>
                <span className="text-xs text-muted-foreground">{filtered.length}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm overflow-y-auto p-0">
              <div className="border-b border-border p-4">
                <p className="font-display text-base font-bold">Filter by department</p>
              </div>
              <div className="space-y-1 p-3">
                <button
                  onClick={() => {
                    setParam("category", null);
                    setFiltersOpen(false);
                  }}
                  className={`w-full rounded-md px-3 py-2.5 text-left text-sm ${
                    !activeMain ? "bg-primary/10 font-semibold text-primary" : "hover:bg-secondary"
                  }`}
                >
                  All products
                </button>
                {tree.map((m) => {
                  const Icon = getCategoryIcon(m.slug);
                  const on = activeMain?.slug === m.slug;
                  return (
                    <div key={m.id}>
                      <button
                        onClick={() => setParam("category", on ? null : m.slug)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm ${
                          on ? "bg-primary/10 font-semibold text-primary" : "hover:bg-secondary"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="flex-1 truncate">{m.name}</span>
                        <span className="text-[11px] text-muted-foreground">{countFor(m)}</span>
                      </button>
                      {on && m.children.length > 0 && (
                        <div className="mb-1 ml-4 space-y-0.5 border-l border-border pl-3">
                          {m.children.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setParam("sub", activeSub?.slug === c.slug ? null : c.slug);
                                setFiltersOpen(false);
                              }}
                              className={`block w-full truncate rounded px-2 py-2 text-left text-[13px] ${
                                activeSub?.slug === c.slug
                                  ? "bg-secondary font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border p-3">
                <Button className="w-full" onClick={() => setFiltersOpen(false)}>
                  Show {filtered.length} products
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="mt-4 grid gap-6 lg:mt-5 lg:grid-cols-[228px_minmax(0,1fr)]">
          {/* Taxonomy filter, identical structure to the category pages */}
          <aside className="hidden min-w-0 lg:sticky lg:top-[92px] lg:block lg:self-start">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Departments
            </p>
            {catsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <div className="block">
                <button
                  onClick={() => setParam("category", null)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    !activeMain ? "bg-primary/10 font-semibold text-primary" : "hover:bg-secondary"
                  }`}
                >
                  All products
                </button>
                {tree.map((m) => {
                  const Icon = getCategoryIcon(m.slug);
                  const on = activeMain?.slug === m.slug;
                  return (
                    <div key={m.id} className="w-full">
                      <button
                        onClick={() => setParam("category", on ? null : m.slug)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          on ? "bg-primary/10 font-semibold text-primary" : "hover:bg-secondary"
                        }`}
                      >
                        <Icon size={17} />
                        <span className="flex-1 truncate">{m.name}</span>
                        {!loading && (
                          <span className="text-[11px] text-muted-foreground">{countFor(m)}</span>
                        )}
                      </button>

                      {on && m.children.length > 0 && (
                        <div className="mt-1 space-y-0.5 border-l border-border pl-3">
                          {m.children.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setParam("sub", activeSub?.slug === c.slug ? null : c.slug)}
                              className={`block w-full truncate rounded px-2 py-1.5 text-left text-[13px] transition-colors ${
                                activeSub?.slug === c.slug
                                  ? "bg-secondary font-medium text-foreground"
                                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeMain && (
              <Link
                to={`/category/${(activeSub || activeMain).slug}`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Open the {(activeSub || activeMain).name} page
                <IconArrowRight size={13} />
              </Link>
            )}
          </aside>


          <section className="min-w-0">
            {/* Mobile subcategory row */}
            {activeMain && activeMain.children.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {activeMain.children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setParam("sub", activeSub?.slug === c.slug ? null : c.slug)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      activeSub?.slug === c.slug
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary/50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                    <Skeleton className="aspect-square w-full rounded-md" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : pageItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Nothing here matches that yet.
                </p>
                <Button className="mt-4" onClick={() => setParams(new URLSearchParams())}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                  {pageItems.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={(prod: Product, v?: ProductVariant) => addToCart(prod, v)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-7 flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
