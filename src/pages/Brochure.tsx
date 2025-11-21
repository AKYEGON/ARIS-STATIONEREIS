import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import BrochureCover from "@/components/brochure/BrochureCover";
import BrochureProduct from "@/components/brochure/BrochureProduct";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Brochure = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      const formattedProducts: Product[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: Number(item.price),
        originalPrice: item.original_price ? Number(item.original_price) : undefined,
        image: item.image,
        category: item.category,
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Print/Navigation controls - hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Brochure
          </Button>
        </div>
      </div>

      {/* Brochure Content */}
      <div className="brochure-page">
        {/* Cover Page */}
        <BrochureCover />

        {/* Products Page */}
        <div className="min-h-screen bg-background print:min-h-0">
          {/* Compact Header for products page */}
          <header className="bg-primary/5 border-b border-border py-2 print:py-1">
            <div className="container mx-auto px-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="h-6 w-6 print:h-5 print:w-5" />
                <span className="font-bold text-sm print:text-xs">ARIS STATIONARIES</span>
              </div>
              <span className="text-xs text-muted-foreground print:text-[8px]">Product Catalog</span>
            </div>
          </header>

          <main className="container mx-auto px-2 py-2 print:py-1">
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 print:grid-cols-8 print:gap-1">
              {products.map((product) => (
                <BrochureProduct key={product.id} product={product} />
              ))}
            </div>
          </main>

          {/* Compact Footer */}
          <footer className="border-t border-border py-2 mt-4 print:py-1 print:mt-2">
            <div className="container mx-auto px-2 text-center text-[10px] text-muted-foreground print:text-[8px]">
              <p>📞 +254 123 456 789 | ✉️ info@arisstationaries.com | 📍 Nairobi, Kenya</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Brochure;
