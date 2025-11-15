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
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
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
      <CardContent className="p-3 sm:p-4">
        <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
        {product.originalPrice && product.originalPrice > product.price ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs sm:text-sm text-muted-foreground line-through">
              Was KSh {product.originalPrice.toFixed(2)}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              Now KSh {product.price.toFixed(2)}
            </p>
          </div>
        ) : (
          <p className="text-xl sm:text-2xl font-bold text-primary">
            KSh {product.price.toFixed(2)}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button 
          className="w-full transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90" 
          onClick={() => onAddToCart(product)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          <span className="hidden xs:inline">Add to Cart</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
