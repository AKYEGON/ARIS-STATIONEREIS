import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import SEO from "@/components/common/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Search, ChevronLeft, ChevronRight, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductCategory } from "@/types/product";

import OffersSection from "@/components/products/OffersSection";

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
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);


  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

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

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SEO 
        title="ARIS STATIONERIES - Home of Affordable Stationeries | Nairobi, Kenya"
        description="Shop quality stationery at affordable prices. ARIS STATIONERIES offers pens, notebooks, office supplies, and more. Fast delivery in Nairobi, Kenya."
        canonicalUrl="/"
      />
      <Header cartItemCount={getCartItemCount()} />
      
      {/* Offers Section - moved to top */}
      <OffersSection />

      {/* Search Section */}
      <section className="container py-4 sm:py-6 md:py-8 px-4">
        <div className="max-w-xl mx-auto space-y-4">
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
                  className="animate-fade-in h-full"
                  style={{ animationDelay: `${index * 0.05}s` }}
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
              <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-8 sm:mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-10 w-10 sm:h-10 sm:w-10 transition-all duration-200 disabled:opacity-50 touch-manipulation"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`h-10 w-10 text-sm sm:text-base transition-all duration-200 touch-manipulation ${
                        currentPage === page ? 'scale-110' : ''
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
                  className="h-10 w-10 sm:h-10 sm:w-10 transition-all duration-200 disabled:opacity-50 touch-manipulation"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
