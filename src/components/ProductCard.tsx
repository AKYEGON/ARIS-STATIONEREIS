import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
      <div className="aspect-square overflow-hidden bg-muted relative">
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
      </div>
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 line-clamp-3 min-h-[3.6rem] sm:min-h-[3rem] leading-tight">
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
          {product.description}
        </p>
        {product.originalPrice && product.originalPrice > product.price ? (
          <div className="flex flex-col gap-1 mt-auto">
            <p className="text-xs sm:text-sm text-muted-foreground line-through">
              Was KSh {product.originalPrice.toFixed(2)}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
              Now KSh {product.price.toFixed(2)}
            </p>
          </div>
        ) : (
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary mt-auto">
            KSh {product.price.toFixed(2)}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 sm:p-5 pt-0">
        <Button 
          className="w-full h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90 touch-manipulation" 
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden xs:inline">Add to Cart</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
