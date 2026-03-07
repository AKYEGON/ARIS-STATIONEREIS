import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bundle } from "@/types/bundle";
import { ShoppingCart } from "lucide-react";

interface BundleCardProps {
  bundle: Bundle;
  onAddToCart: (bundle: Bundle) => void;
  compact?: boolean;
}

const BundleCard = ({ bundle, onAddToCart, compact = false }: BundleCardProps) => {
  const savings = bundle.original_total_price - bundle.bundle_price;
  const savingsPercentage = Math.round((savings / bundle.original_total_price) * 100);

  if (compact) {
    return (
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col">
        <div className="relative overflow-hidden aspect-[4/3]">
          <Badge className="absolute top-1 right-1 z-10 bg-primary text-[9px] px-1.5 py-0">
            -{savingsPercentage}%
          </Badge>
          <img
            src={bundle.image}
            alt={bundle.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-2 flex flex-col flex-1">
          <h3 className="font-semibold text-[11px] sm:text-xs mb-0.5 line-clamp-1">{bundle.name}</h3>
          <div className="flex items-baseline gap-1 mb-1 mt-auto">
            <span className="text-[9px] text-muted-foreground line-through">
              KSh {bundle.original_total_price.toFixed(0)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-primary">
              KSh {bundle.bundle_price.toFixed(0)}
            </span>
          </div>
          <Button
            onClick={() => onAddToCart(bundle)}
            size="sm"
            className="w-full h-6 text-[10px] gap-1"
          >
            <ShoppingCart className="h-3 w-3" />
            Add
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
      <div className="relative overflow-hidden aspect-[4/3] xs:aspect-square">
        <Badge className="absolute top-1.5 right-1.5 xs:top-2 xs:right-2 z-10 bg-primary text-[10px] xs:text-xs px-1.5 xs:px-2">
          Save {savingsPercentage}%
        </Badge>
        <img
          src={bundle.image}
          alt={bundle.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <CardContent className="p-2.5 xs:p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm xs:text-base sm:text-lg mb-1 xs:mb-2 line-clamp-2">{bundle.name}</h3>
        {bundle.description && (
          <p className="text-xs xs:text-sm text-muted-foreground mb-2 xs:mb-3 line-clamp-2">
            {bundle.description}
          </p>
        )}
        {bundle.items && bundle.items.length > 0 && (
          <div className="mb-2 xs:mb-3 text-[10px] xs:text-xs text-muted-foreground line-clamp-2">
            Contains: {bundle.items.map(item => 
              `${item.product?.name || 'Product'} ${item.quantity > 1 ? `(×${item.quantity})` : ''}`
            ).join(', ')}
          </div>
        )}
        <div className="flex flex-col xs:flex-row xs:items-baseline gap-0.5 xs:gap-2 mb-1.5 xs:mb-3 mt-auto">
          <span className="text-[10px] xs:text-sm text-muted-foreground line-through">
            KSh {bundle.original_total_price.toFixed(0)}
          </span>
          <span className="text-base xs:text-lg sm:text-xl font-bold text-primary">
            KSh {bundle.bundle_price.toFixed(0)}
          </span>
        </div>
        <div className="text-[10px] xs:text-xs font-medium text-green-600 mb-2 xs:mb-3">
          Save KSh {savings.toFixed(0)}
        </div>
        <Button
          onClick={() => onAddToCart(bundle)}
          className="w-full h-8 xs:h-9 sm:h-10 text-xs xs:text-sm transition-all duration-200 active:scale-95 gap-1.5"
        >
          <ShoppingCart className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
          <span className="hidden xs:inline">Add Bundle to Cart</span>
          <span className="xs:hidden">Add to Cart</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default BundleCard;
