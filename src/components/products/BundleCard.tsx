import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bundle } from "@/types/bundle";
import { Info, ShoppingCart } from "lucide-react";
import BundleCollage from "./BundleCollage";

interface BundleCardProps {
  bundle: Bundle;
  onAddToCart: (bundle: Bundle) => void;
  compact?: boolean;
}

const BundleCard = ({ bundle, onAddToCart, compact = false }: BundleCardProps) => {
  const savings = bundle.original_total_price - bundle.bundle_price;
  const savingsPercentage = Math.round((savings / bundle.original_total_price) * 100);

  if (compact) {
    const itemCount = bundle.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return (
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-md h-full flex flex-col shadow-sm">
        <div className="relative overflow-hidden aspect-square bg-white">
          <Badge className="absolute top-1 right-1 z-10 bg-primary text-[9px] px-1.5 py-0">
            -{savingsPercentage}%
          </Badge>
          {bundle.image ? (
            <img
              src={bundle.image}
              alt={bundle.name}
              className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <BundleCollage bundle={bundle} />
          )}
        </div>
        <CardContent className="p-2 xs:p-3 sm:p-4 flex flex-1 flex-col gap-1.5 min-h-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[11px] xs:text-xs sm:text-sm leading-tight line-clamp-1 min-w-0 flex-1">
              {bundle.name}
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-primary"
                  aria-label="View bundle details"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-3 text-[11px] xs:text-xs">
                <div className="space-y-1.5 leading-relaxed">
                  <p className="font-medium text-foreground">{bundle.name}</p>
                  {bundle.description && <p>{bundle.description}</p>}
                  <p>{itemCount} item{itemCount === 1 ? "" : "s"} included</p>
                  {bundle.items && bundle.items.length > 0 && (
                    <p>
                      Contains: {bundle.items.map((item) => `${item.product?.name || "Product"}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ")}
                    </p>
                  )}
                  <p>Save KSh {savings.toFixed(0)}</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-[10px] xs:text-xs text-muted-foreground line-clamp-1">
            {itemCount} item{itemCount === 1 ? "" : "s"} included
          </p>

          <div className="mt-auto flex items-baseline gap-1">
            <span className="text-[9px] text-muted-foreground line-through">
              KSh {bundle.original_total_price.toFixed(0)}
            </span>
            <span className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight">
              KSh {bundle.bundle_price.toFixed(0)}
            </span>
          </div>
          <Button
            onClick={() => onAddToCart(bundle)}
            className="w-full h-8 xs:h-9 sm:h-10 text-[11px] xs:text-xs sm:text-sm gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
            <span className="hidden xs:inline">Add to Cart</span>
            <span className="xs:hidden">Add</span>
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
        {bundle.image ? (
          <img
            src={bundle.image}
            alt={bundle.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <BundleCollage bundle={bundle} />
        )}
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
