import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Images } from "lucide-react";
import { Product, ProductVariant } from "@/types/product";
import ProductMediaViewer from "./ProductMediaViewer";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedVariant?: ProductVariant) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const isMobile = useIsMobile();

  const hasMultipleMedia = product.media && product.media.length > 0;
  const totalMediaCount = 1 + (product.media?.length || 0);
  const hasVariants = product.variants && product.variants.length > 0;

  // Group variants by type
  const variantGroups = hasVariants
    ? product.variants!.reduce<Record<string, ProductVariant[]>>((acc, v) => {
        if (!acc[v.variant_type]) acc[v.variant_type] = [];
        acc[v.variant_type].push(v);
        return acc;
      }, {})
    : {};

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;

  useEffect(() => {
    setImageLoaded(false);
  }, [product.image]);

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
      "price": displayPrice,
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
      
      <Card className="overflow-hidden flex flex-col h-full shadow-sm">
        <Link
          to={`/product/${(product as any).slug || product.id}`}
          className="aspect-square overflow-hidden bg-white relative cursor-pointer flex items-center justify-center group/img"
          aria-label={`View ${product.name} details`}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted" />
          )}
          <img
            src={product.image}
            alt={`${product.name} - ${product.description} - Buy at ARIS STATIONERIES Nairobi Kenya`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`max-h-full max-w-full object-contain p-2 ${!isMobile ? 'transition-all duration-300 group-hover:scale-105' : ''} ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Gallery indicator badge */}
          {hasMultipleMedia && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewerOpen(true); }}
              className="absolute top-1.5 right-1.5 xs:top-2 xs:right-2 rounded-full bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white xs:px-2 xs:py-1 xs:text-xs"
              aria-label="View gallery"
            >
              <Images className="h-2.5 w-2.5 xs:h-3 xs:w-3" />
              <span>{totalMediaCount}</span>
            </button>
          )}
        </Link>
        <CardContent className="p-2 xs:p-3 sm:p-4 flex-1">
          <Link to={`/product/${(product as any).slug || product.id}`} className="block hover:text-primary transition-colors">
            <h3 className="font-semibold text-[11px] xs:text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-[10px] xs:text-xs text-muted-foreground mb-1.5 xs:mb-2 line-clamp-1">
            {product.description}
          </p>

          {/* Variant Selection */}
          {hasVariants && Object.entries(variantGroups).map(([type, variants]) => (
            <div key={type} className="mb-1.5">
              <p className="text-[9px] xs:text-[10px] text-muted-foreground font-medium mb-0.5">{type}</p>
              <div className="flex flex-wrap gap-1">
                {variants.map((v) => {
                  const outOfStock = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => !outOfStock && setSelectedVariant(selectedVariant?.id === v.id ? undefined : v)}
                      className={`text-[9px] xs:text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                        outOfStock
                          ? 'border-border/40 bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through'
                          : selectedVariant?.id === v.id
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {v.variant_value}
                      <span className="ml-0.5 opacity-70">
                        {outOfStock ? 'Out of Stock' : `KSh ${v.price.toFixed(0)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            {!selectedVariant && product.originalPrice && product.originalPrice > product.price ? (
              <div className="flex flex-col gap-0">
                <p className="text-[10px] xs:text-xs text-muted-foreground line-through leading-tight">
                  Was KSh {product.originalPrice.toFixed(0)}
                </p>
                <p className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight">
                  KSh {displayPrice.toFixed(0)}
                </p>
              </div>
            ) : (
              <p className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight">
                KSh {displayPrice.toFixed(0)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-2 xs:p-3 sm:p-4 pt-0">
          <Button 
            className="w-full h-8 xs:h-9 sm:h-10 text-[11px] xs:text-xs sm:text-sm transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90 touch-manipulation"
            onClick={() => {
              if (hasVariants && !selectedVariant) {
                toast.error("Please select an option first");
                return;
              }
              onAddToCart(product, selectedVariant);
            }}
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline">
              {hasVariants && !selectedVariant ? "Select Option" : "Add to Cart"}
            </span>
            <span className="xs:hidden">
              {hasVariants && !selectedVariant ? "Select" : "Add"}
            </span>
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
