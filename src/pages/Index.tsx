import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import SEO from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductCategory } from "@/types/product";
import OffersSection from "@/components/products/OffersSection";
import CategoryRotator from "@/components/products/CategoryRotator";

const PRODUCTS_PER_PAGE = 8;
const SEARCH_STORAGE_KEY = "aris-search-query";

/* ─── Offers ticker component ─────────────────────────────────── */
const OffersTicker = () => {
  const items = [
    "🎒 Buy 3 notebooks, get 1 free",
    "📐 Student bundles for UoN · KU · Strathmore · USIU",
    "🖩 20% off all Casio calculators",
    "🚚 Same-day delivery in Nairobi",
    "✏️ Back to school — 20% off sitewide",
  ];

  return (
    <div
      className="overflow-hidden border-b"
      style={{ background: "#EFF6F0", borderColor: "#DDE8DF" }}
    >
      <div
        className="flex gap-12 py-2.5 w-max"
        style={{ animation: "ticker 32s linear infinite" }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-[12.5px] font-medium whitespace-nowrap"
            style={{ color: "#5C7A5F" }}
          >
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
const Index = () => {
  const { addToCart, getCartItemCount } = useCart();

  const [searchQuery, setSearchQuery] = useState(() => {
    try { return sessionStorage.getItem(SEARCH_STORAGE_KEY) || ""; }
    catch { return ""; }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [categoryProductMap, setCategoryProductMap] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<string>("price-asc");
  const [screenSize, setScreenSize] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    sessionStorage.setItem(SEARCH_STORAGE_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handle = () => setScreenSize(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`*, media:product_media(*), variants:product_variants(*)`)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        category: p.category,
        image: p.image,
        is_featured: p.is_featured,
        display_order: p.display_order,
        slug: (p as any).slug,
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
      }));

      formatted.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        const aO = a.display_order || 0;
        const bO = b.display_order || 0;
        if (aO > 0 && bO === 0) return -1;
        if (aO === 0 && bO > 0) return 1;
        if (aO > 0 && bO > 0) return aO - bO;
        return 0;
      });

      setProducts(formatted);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const [catRes, assignRes] = await Promise.all([
        supabase.from("product_categories").select("*").eq("is_active", true).order("display_order", { ascending: true }),
        supabase.from("product_category_assignments").select("product_id, category_id"),
      ]);
      if (catRes.error) throw catRes.error;
      setCategories(catRes.data || []);

      const catMap: Record<string, string[]> = {};
      const catIdToName: Record<string, string> = {};
      (catRes.data || []).forEach((c) => { catIdToName[c.id] = c.name; });
      (assignRes.data || []).forEach((a) => {
        const name = catIdToName[a.category_id];
        if (name) {
          if (!catMap[name]) catMap[name] = [];
          catMap[name].push(a.product_id);
        }
      });
      setCategoryProductMap(catMap);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "all" ||
        (categoryProductMap[selectedCategory]?.includes(p.id) ?? false);
      return matchSearch && matchCat;
    });
    if (sortBy === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name-asc") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, searchQuery, selectedCategory, categoryProductMap, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const max = screenSize < 640 ? 5 : 7;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = start + max - 1;
    if (end > totalPages) { end = totalPages; start = Math.max(1, end - max + 1); }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [totalPages, currentPage, screenSize]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, sortBy]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF8F4", paddingBottom: "58px" /* mobile nav */ }}>
      <SEO
        title="Aris Stationeries | Affordable Stationery in Kenya — Order Online"
        description="Buy affordable stationery in Kenya. Pens, notebooks, calculators, drawing sets — delivered to UoN, KU, Strathmore, USIU and nationwide. Best prices guaranteed."
        canonicalUrl="/"
        breadcrumbs={[{ name: "Home", url: "/" }]}
      />

      {/* Header — pass search down so it lives in the header on mobile */}
      <Header
        cartItemCount={getCartItemCount()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Offers ticker */}
      <OffersTicker />

      {/* Legacy OffersSection (keeps any banner cards / promos) */}
      <OffersSection />

      {/* ── Category Rotator ── */}
      <CategoryRotator
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* ── Toolbar: result count + sort ── */}
      <div className="max-w-screen-xl mx-auto w-full px-4 md:px-8 py-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#7A8C80]">
          {isLoading ? "Loading…" : (
            <>
              <span className="font-semibold text-[#2C3E35]">{filteredProducts.length} products</span>
              {selectedCategory !== "all" && ` in ${selectedCategory}`}
              {searchQuery && ` for "${searchQuery}"`}
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#7A8C80]" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger
              className="h-9 text-[13px] border-[#DDE8DF] bg-white text-[#2C3E35] rounded-lg focus:ring-[#7A9E7E] focus:border-[#7A9E7E]"
              style={{ minWidth: 160 }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="featured">Featured First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Product Grid ── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 pb-12">
        {isLoading ? (
          /* Skeleton loader */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden border border-[#DDE8DF]"
                style={{ background: "#fff", animationDelay: `${i * 0.06}s` }}
              >
                <div
                  className="animate-pulse"
                  style={{ background: "#EFF6F0", aspectRatio: "1/1" }}
                />
                <div className="p-4 space-y-2 animate-pulse">
                  <div className="h-2 rounded-full w-1/3" style={{ background: "#EFF6F0" }} />
                  <div className="h-3 rounded-full w-3/4" style={{ background: "#EFF6F0" }} />
                  <div className="h-3 rounded-full w-1/2" style={{ background: "#EFF6F0" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl"
              style={{ background: "#EFF6F0" }}
            >
              🔍
            </div>
            <p className="text-[17px] font-medium text-[#2C3E35] mb-1">No products found</p>
            <p className="text-[13px] text-[#7A8C80]">
              Try a different search or category
            </p>
            <button
              className="mt-6 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white transition-colors"
              style={{ background: "#2C3E35" }}
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {currentProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <ProductCard product={product} onAddToCart={addToCart} />
                </div>
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {/* Prev */}
                  <button
                    onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollTop(); }}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      width: 38, height: 38,
                      borderColor: "#DDE8DF",
                      background: "#fff",
                      color: "#4A5C50",
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page numbers */}
                  {visiblePages.map((page) => (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page); scrollTop(); }}
                      className="flex items-center justify-center rounded-lg border text-[13px] font-medium transition-colors"
                      style={{
                        width: 38, height: 38,
                        background: currentPage === page ? "#2C3E35" : "#fff",
                        color: currentPage === page ? "#fff" : "#4A5C50",
                        borderColor: currentPage === page ? "#2C3E35" : "#DDE8DF",
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next */}
                  <button
                    onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollTop(); }}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      width: 38, height: 38,
                      borderColor: "#DDE8DF",
                      background: "#fff",
                      color: "#4A5C50",
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-[12px] tracking-wide" style={{ color: "#7A8C80" }}>
                  Showing {startIndex + 1}–{Math.min(startIndex + PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;