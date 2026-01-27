import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Images } from "lucide-react";
import { Product } from "@/types/product";
import ProductMediaViewer from "./ProductMediaViewer";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const hasMultipleMedia = product.media && product.media.length > 0;
  const totalMediaCount = 1 + (product.media?.length || 0);

  // Generate product URL for SEO
  const productUrl = `https://arisstationaries.co.ke/products/${product.id}`;
  
  // Product Schema for SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image.startsWith("http") ? product.image : `https://arisstationaries.co.ke${product.image}`,
    "brand": {
      "@type": "Brand",
      "name": "ARIS STATIONERIES"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "KES",
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "ARIS STATIONERIES"
      }
    },
    ...(product.originalPrice && product.originalPrice > product.price ? {
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    } : {})
  };

  return (
    <>
      {/* JSON-LD Product Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col">
        <div 
          className="aspect-[4/3] xs:aspect-square overflow-hidden bg-muted relative cursor-pointer"
          onClick={() => hasMultipleMedia && setViewerOpen(true)}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={product.image}
            alt={`${product.name} - ${product.description} - Buy at ARIS STATIONERIES Nairobi Kenya`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Gallery indicator badge */}
          {hasMultipleMedia && (
            <div className="absolute top-1.5 right-1.5 xs:top-2 xs:right-2 bg-black/70 text-white px-1.5 py-0.5 xs:px-2 xs:py-1 rounded-full flex items-center gap-0.5 xs:gap-1 text-[10px] xs:text-xs font-medium backdrop-blur-sm">
              <Images className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
              <span>{totalMediaCount}</span>
            </div>
          )}
        </div>
        <CardContent className="p-2 xs:p-3 sm:p-4">
          <h3 className="font-semibold text-[11px] xs:text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-[10px] xs:text-xs text-muted-foreground mb-1.5 xs:mb-2 line-clamp-1">
            {product.description}
          </p>
          <div>
            {product.originalPrice && product.originalPrice > product.price ? (
              <div className="flex flex-col gap-0">
                <p className="text-[10px] xs:text-xs text-muted-foreground line-through leading-tight">
                  Was KSh {product.originalPrice.toFixed(0)}
                </p>
                <p className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight">
                  KSh {product.price.toFixed(0)}
                </p>
              </div>
            ) : (
              <p className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight">
                KSh {product.price.toFixed(0)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-2 xs:p-3 sm:p-4 pt-0">
          <Button 
            className="w-full h-8 xs:h-9 sm:h-10 text-[11px] xs:text-xs sm:text-sm transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90 touch-manipulation"
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline">Add to Cart</span>
            <span className="xs:hidden">Add</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Media Viewer Dialog */}
      <ProductMediaViewer
        product={product}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
};

export default ProductCard;
