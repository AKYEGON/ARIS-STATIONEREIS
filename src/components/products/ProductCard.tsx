import Watermark from "@/components/common/Watermark";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Images } from "lucide-react";
import { Product, ProductVariant } from "@/types/product";
import ProductMediaViewer from "./ProductMediaViewer";
import SaleBadge, { isOnSale } from "./SaleBadge";
import CountdownTimer from "./CountdownTimer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedVariant?: ProductVariant) => void;
  compact?: boolean;
}

const ProductCard = ({ product, onAddToCart, compact = false }: ProductCardProps) => {
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
      "name": "Aris Stationeries"
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "KES",
      "price": displayPrice,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Aris Stationeries"
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
            alt={`${product.name} - ${product.description} - Buy at Aris Stationeries Nairobi Kenya`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`max-h-full max-w-full object-contain p-2 ${!isMobile ? 'transition-all duration-300 group-hover:scale-105' : ''} ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <Watermark size="sm" />


          {/* Sale badge (top-left) */}
          <SaleBadge
            price={product.price}
            originalPrice={product.originalPrice}
            saleStartsAt={product.saleStartsAt}
            saleEndsAt={product.saleEndsAt}
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
        <CardContent className={compact ? "p-2 xs:p-3 sm:p-4 flex flex-1 flex-col gap-1.5 min-h-0" : "p-2 xs:p-3 sm:p-4 flex-1"}>
          <Link to={`/product/${(product as any).slug || product.id}`} className="block hover:text-primary transition-colors">
            <h3 className={`font-semibold text-[11px] xs:text-xs sm:text-sm leading-tight ${compact ? "line-clamp-1" : "mb-1 line-clamp-2"}`}>
              {product.name}
            </h3>
          </Link>
          {!compact && (
            <p className="text-[10px] xs:text-xs text-muted-foreground mb-1.5 xs:mb-2 line-clamp-1">
              {product.description}
            </p>
          )}

          {/* Variant Selection — compact dropdown keeps card height consistent */}
          {hasVariants && Object.entries(variantGroups).map(([type, variants]) => {
            const allOut = variants.every((v) => v.stock <= 0);
            return (
              <div key={type} className="mb-1.5">
                <Select
                  value={selectedVariant && variants.some((v) => v.id === selectedVariant.id) ? selectedVariant.id : undefined}
                  onValueChange={(val) => {
                    const v = variants.find((x) => x.id === val);
                    if (v && v.stock > 0) setSelectedVariant(v);
                  }}
                  disabled={allOut}
                >
                  <SelectTrigger className="h-7 xs:h-8 text-[10px] xs:text-xs px-2 py-0 bg-background">
                    <SelectValue placeholder={allOut ? `${type} — Out of stock` : `Select ${type}`} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {variants.map((v) => {
                      const outOfStock = v.stock <= 0;
                      return (
                        <SelectItem
                          key={v.id}
                          value={v.id}
                          disabled={outOfStock}
                          className="text-xs"
                        >
                          <span className="flex items-center justify-between gap-3 w-full">
                            <span className={outOfStock ? "line-through text-muted-foreground" : "font-medium"}>
                              {v.variant_value}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {outOfStock ? "Out of stock" : `KSh ${v.price.toFixed(0)}`}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          })}

          <div className={compact ? "mt-auto" : ""}>
            {!selectedVariant && product.originalPrice && product.originalPrice > product.price ? (
              <div className="flex flex-col gap-0">
                <p className="text-[10px] xs:text-xs text-muted-foreground line-through leading-tight">
                  Was KSh {product.originalPrice.toFixed(0)}
                </p>
                <p className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight">
                  KSh {displayPrice.toFixed(0)}
                </p>
                {!compact && product.saleEndsAt && isOnSale(product.price, product.originalPrice, product.saleStartsAt, product.saleEndsAt) && (
                  <CountdownTimer endsAt={product.saleEndsAt} compact className="mt-0.5" />
                )}
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
