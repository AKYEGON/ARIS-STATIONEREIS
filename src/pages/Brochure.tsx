import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import BrochureCover from "@/components/brochure/BrochureCover";
import BrochureProduct from "@/components/brochure/BrochureProduct";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Brochure = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const brochureRef = useRef<HTMLDivElement>(null);

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

  const handleShare = async () => {
    try {
      // Use Web Share API for text/URL sharing
      if (navigator.share) {
        await navigator.share({
          title: "ARIS Stationaries Catalog",
          text: "Check out our product catalog! Use Print > Save as PDF to download.",
          url: window.location.href,
        });
        
        toast({
          title: "Shared Successfully!",
          description: "Link has been shared.",
        });
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Catalog link copied to clipboard. Use Print > Save as PDF to download.",
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        toast({
          title: "Share Cancelled",
          description: "You cancelled the share action.",
        });
        return;
      }
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description: "Unable to share. Please use the Print button instead.",
        variant: "destructive",
      });
    }
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
      <SEO
        title="Product Catalog"
        description="Browse our complete product catalog. Download or print our stationery brochure from ARIS STATIONARIES, Nairobi."
        canonicalUrl="/brochure"
      />
      {/* Print/Navigation controls - hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={handleShare}
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              variant="default"
              className="flex-1 sm:flex-initial"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Brochure Content */}
      <div className="brochure-page" ref={brochureRef}>
        {/* Cover Page */}
        <BrochureCover />

        {/* Products Page */}
        <div className="min-h-screen bg-background print:min-h-0">
          {/* Compact Header for products page */}
          <header className="bg-primary/5 border-b border-border py-2 print:py-1">
            <div className="container mx-auto px-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-6 w-6 print:h-5 print:w-5"
                />
                <span className="font-bold text-sm print:text-xs">
                  ARIS STATIONARIES
                </span>
              </div>
              <span className="text-xs text-muted-foreground print:text-[8px]">
                Product Catalog
              </span>
            </div>
          </header>

          <main className="container mx-auto px-2 py-2 print:py-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 print:grid-cols-6 print:gap-2">
              {products
                .reduce((acc, product, index) => {
                  const rowIndex = Math.floor(index / 6);
                  if (!acc[rowIndex]) acc[rowIndex] = [];
                  acc[rowIndex].push(product);
                  return acc;
                }, [] as Product[][])
                .map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}`}
                    className="contents print:block print:break-inside-avoid print:mb-2"
                  >
                    {row.map((product) => (
                      <BrochureProduct key={product.id} product={product} />
                    ))}
                  </div>
                ))}
            </div>
          </main>

          {/* Compact Footer */}
          <footer className="border-t border-border py-2 mt-4 print:py-1 print:mt-2">
            <div className="container mx-auto px-2 text-center text-[10px] text-muted-foreground print:text-[8px]">
              <p className="hidden sm:inline">
                📞 0707222419 | ✉️ scaler.com@gmail.com | 📍 Nairobi, Kenya
              </p>
              <p className="sm:hidden text-xs">
                📞 0707222419
                <br />
                ✉️ scaler.com@gmail.com
                <br />
                📍 Nairobi, Kenya
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Brochure;
