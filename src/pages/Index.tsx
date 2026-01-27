import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import SEO from "@/components/common/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import heroBackground from "@/assets/hero-background.jpg";
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
          media:product_media(*)
        `)
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
        media: (p.media || []).map(m => ({
          ...m,
          media_type: m.media_type as 'image' | 'video'
        }))
      }));
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="ARIS STATIONERIES - Home of Affordable Stationeries | Nairobi, Kenya"
        description="Shop quality stationery at affordable prices. ARIS STATIONERIES offers pens, notebooks, office supplies, and more. Fast delivery in Nairobi, Kenya."
        canonicalUrl="/"
      />
      <Header cartItemCount={getCartItemCount()} />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 px-4 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-white/85 dark:from-black/90 dark:via-black/85 dark:to-black/80" />
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary animate-fade-in drop-shadow-sm">
              ARIS STATIONERIES
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground animate-fade-in drop-shadow-sm">
              THE HOME OF AFFORDABLE STATIONERIES
            </p>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground animate-fade-in max-w-2xl mx-auto">
              Your trusted partner for all stationery needs
            </p>
          </div>
        </div>
      </section>

      {/* Offers Section */}
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
              className="pl-9 sm:pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary"
            />
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
