import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import SEO from "@/components/common/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Users, X, SlidersHorizontal, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductCategory } from "@/types/product";
import OffersSection from "@/components/products/OffersSection";
import CategoryRotator from "@/components/products/CategoryRotator";

const PRODUCTS_PER_PAGE = 8;

const SEARCH_STORAGE_KEY = "aris-search-query";


const Index = () => {
  const { addToCart, getCartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return sessionStorage.getItem(SEARCH_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [categoryProductMap, setCategoryProductMap] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<string>("featured");

  // Persist search query to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SEARCH_STORAGE_KEY, searchQuery);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          media:product_media(*),
          variants:product_variants(*)
        `)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedProducts = (data || []).map(p => ({
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
          media_type: m.media_type as 'image' | 'video'
        })),
        variants: ((p as any).variants || []).filter((v: any) => v.is_active).map((v: any) => ({
          ...v,
          price: Number(v.price),
          cost_price: Number(v.cost_price),
        }))
      }));

      // Sort: featured first, then by display_order (>0 first in ascending order, 0 = unset goes last)
      formattedProducts.sort((a, b) => {
        // Featured products first
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        // Within same featured group: products with display_order > 0 come first
        const aOrder = a.display_order || 0;
        const bOrder = b.display_order || 0;
        if (aOrder > 0 && bOrder === 0) return -1;
        if (aOrder === 0 && bOrder > 0) return 1;
        if (aOrder > 0 && bOrder > 0) return aOrder - bOrder;
        return 0; // both 0, keep original order
      });

      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const [catRes, assignRes] = await Promise.all([
        supabase
          .from("product_categories")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase
          .from("product_category_assignments")
          .select("product_id, category_id")
      ]);

      if (catRes.error) throw catRes.error;
      setCategories(catRes.data || []);

      // Build a map: category_name -> product_id[]
      const catMap: Record<string, string[]> = {};
      const catIdToName: Record<string, string> = {};
      (catRes.data || []).forEach(c => { catIdToName[c.id] = c.name; });
      (assignRes.data || []).forEach(a => {
        const name = catIdToName[a.category_id];
        if (name) {
          if (!catMap[name]) catMap[name] = [];
          catMap[name].push(a.product_id);
        }
      });
      setCategoryProductMap(catMap);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);


  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" ||
        (categoryProductMap[selectedCategory]?.includes(product.id) ?? false);
      return matchesSearch && matchesCategory;
    });
    if (sortBy === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === "name-asc") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list; // "featured" preserves the default featured/display_order sort
  }, [products, searchQuery, selectedCategory, categoryProductMap, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Track screen size for responsive pagination
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 640; // Default
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fixed pagination logic - show different number of pages by screen size
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    
    // Determine max pages to show based on screen size
    const maxPages = screenSize < 640 ? 5 : 8; // Mobile: 5, Tablet/Desktop: 8
    const pages: number[] = [];
    
    // Calculate start and end pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = startPage + maxPages - 1;
    
    // Adjust if we go beyond total pages
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // Generate the page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [totalPages, currentPage, screenSize]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isMobileLayout = screenSize < 768;

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SEO
        title="Aris Stationeries | Affordable Stationery in Kenya — Order Online"
        description="Buy affordable stationery in Kenya. Pens, notebooks, calculators, drawing sets — delivered to UoN, KU, Strathmore, USIU and nationwide. Best prices guaranteed."
        canonicalUrl="/"
        breadcrumbs={[{ name: "Home", url: "/" }]}
      />
      <Header cartItemCount={getCartItemCount()} />
      
      {/* Offers Section - moved to top */}
      <OffersSection />

      {/* Search Section */}
      <section className="container py-4 sm:py-6 md:py-8 px-4">
        <div className="max-w-xl mx-auto space-y-4">
          {isMobileLayout ? (
            <div className="space-y-2">
              <label htmlFor="mobile-search" className="sr-only">
                Search products
              </label>
              <input
                id="mobile-search"
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-md border border-primary/30 bg-background px-3 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              />
              {searchQuery && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 pr-9 bg-secondary border-primary/30 transition-all duration-200 focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">Sort by:</span>

            {/* Mobile: Filter button on the side */}
            <div className="md:hidden ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background z-50">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    { value: "featured", label: "Featured" },
                    { value: "price-asc", label: "Price: Low to High" },
                    { value: "price-desc", label: "Price: High to Low" },
                    { value: "name-asc", label: "Name: A to Z" },
                  ].map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden flex-1 md:block">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 bg-secondary border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-center md:hidden">
            <Button variant="outline" size="sm" asChild>
              <Link to="/testimonials">
                <Users className="h-4 w-4 mr-2" />
                Happy Customers
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category Rotator */}
      <CategoryRotator
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        useNativeSelectOnMobile
      />

      {/* Products Section */}
      <main className="flex-1 container pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4">
        {isLoading ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6 auto-rows-max">
              {currentProducts.map((product, index) => (
                <div 
                  key={product.id}
                  className="h-full"
                >
                  <ProductCard
                    product={product}
                    onAddToCart={addToCart}
                  />
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <>
              <div className="flex flex-col items-center gap-3 sm:gap-4 mt-6 sm:mt-8 md:mt-12">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap max-w-full overflow-x-auto px-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="h-9 w-9 xs:h-10 xs:w-10 sm:h-10 sm:w-10 transition-all duration-200 disabled:opacity-50 touch-manipulation flex-shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4 xs:h-5 xs:w-5" />
                  </Button>
                  
                  <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-wrap justify-center">
                    {visiblePages.map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 text-xs xs:text-sm sm:text-base transition-all duration-200 touch-manipulation flex-shrink-0 ${
                          currentPage === page ? 'scale-105 xs:scale-110' : ''
                        }`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 xs:h-10 xs:w-10 sm:h-10 sm:w-10 transition-all duration-200 disabled:opacity-50 touch-manipulation flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4 xs:h-5 xs:w-5" />
                  </Button>
                </div>
                
                <div className="text-center text-xs xs:text-sm text-muted-foreground px-4">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                </div>
              </div>
              </>
            )}
            
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
