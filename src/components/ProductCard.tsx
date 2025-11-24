import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
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

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
        <div 
          className="aspect-square overflow-hidden bg-muted relative cursor-pointer"
          onClick={() => hasMultipleMedia && setViewerOpen(true)}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Gallery indicator badge */}
          {hasMultipleMedia && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium backdrop-blur-sm">
              <Images className="h-3 w-3" />
              <span>{totalMediaCount}</span>
            </div>
          )}
        </div>
      <CardContent className="p-2 sm:p-4 md:p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2 line-clamp-3 min-h-[2.5rem] sm:min-h-[3rem] leading-tight">
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2 flex-1">
          {product.description}
        </p>
        {product.originalPrice && product.originalPrice > product.price ? (
          <div className="flex flex-col gap-0.5 sm:gap-1 mt-auto">
            <p className="text-xs sm:text-sm text-muted-foreground line-through">
              Was KSh {product.originalPrice.toFixed(2)}
            </p>
            <p className="text-sm sm:text-lg md:text-xl font-bold text-primary">
              Now KSh {product.price.toFixed(2)}
            </p>
          </div>
        ) : (
          <p className="text-sm sm:text-lg md:text-xl font-bold text-primary mt-auto">
            KSh {product.price.toFixed(2)}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-2 sm:p-4 md:p-5 pt-0">
        <Button 
          className="w-full h-9 sm:h-11 md:h-12 text-xs sm:text-sm transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90 touch-manipulation"
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
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
