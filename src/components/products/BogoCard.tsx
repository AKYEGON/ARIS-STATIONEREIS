import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Gift, ShoppingCart } from "lucide-react";
import { BogoOffer } from "@/types/bogo";
import { Product } from "@/types/product";

interface BogoCardProps {
  offer: BogoOffer;
  onAddToCart: (product: Product) => void;
}

/**
 * BOGO tile styled to match ProductCard so the homepage offers row reads as
 * one consistent grid. Whole card links to product detail; Add button stops
 * propagation for in-place add-to-cart.
 */
const BogoCard = ({ offer, onAddToCart }: BogoCardProps) => {
  const p = offer.product;
  const freeP = offer.free_product || offer.product;
  const [showDetails, setShowDetails] = useState(false);
  if (!p) return null;

  const sameProduct = !offer.free_product_id || offer.free_product_id === offer.product_id;
  const href = `/product/${p.slug || p.id}`;
  const totalQty = offer.buy_quantity + offer.get_quantity;
  const savingsAmount = (freeP?.price ?? p.price) * offer.get_quantity;
  const compactTitle = p.name;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(p);
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full shadow-sm">
      <Link
        to={href}
        aria-label={`View ${offer.name} details`}
        className="aspect-square overflow-hidden bg-white relative cursor-pointer flex items-center justify-center group/img"
      >
        <Badge className="absolute top-1.5 left-1.5 z-20 bg-purple-600 hover:bg-purple-600 text-[10px] flex items-center gap-1 shadow">
          <Gift className="h-3 w-3" />
          BOGO
        </Badge>

        {sameProduct ? (
          <>
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              className="max-h-full max-w-full object-contain p-2 transition-transform duration-300 hover:scale-105"
            />
            <span className="absolute bottom-1.5 right-1.5 z-20 text-[10px] font-extrabold text-white bg-emerald-600 rounded-full px-2 py-0.5 shadow">
              +{offer.get_quantity} FREE
            </span>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-0.5 w-full h-full">
            <div className="bg-white flex items-center justify-center overflow-hidden p-1.5 relative">
              <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-slate-700 rounded px-1 py-0.5">
                BUY ×{offer.buy_quantity}
              </span>
              <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="bg-emerald-50 flex items-center justify-center overflow-hidden p-1.5 relative">
              <span className="absolute top-1 left-1 text-[9px] font-extrabold text-white bg-emerald-600 rounded px-1.5 py-0.5 shadow">
                FREE ×{offer.get_quantity}
              </span>
              <img src={freeP?.image} alt={freeP?.name} className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        )}
      </Link>

      <CardContent className="p-2 xs:p-3 sm:p-4 flex flex-1 flex-col">
        <Link to={href} className="block hover:text-primary transition-colors">
          <h3 className="font-semibold text-[11px] xs:text-xs sm:text-sm leading-tight mb-1 line-clamp-1">
            {compactTitle}
          </h3>
        </Link>

        <Collapsible open={showDetails} onOpenChange={setShowDetails} className="mb-1.5 xs:mb-2">
          <div className="flex items-start justify-between gap-2">
            <p className="min-h-[1rem] min-w-0 text-[10px] xs:text-xs text-muted-foreground font-medium line-clamp-1">
              Buy {offer.buy_quantity}, get {offer.get_quantity} free
            </p>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-primary"
                aria-label={showDetails ? "Hide offer details" : "Show offer details"}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-2 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-[10px] xs:text-xs text-muted-foreground">
            <div className="space-y-1 leading-relaxed">
              <p className="font-medium text-foreground">{offer.name}</p>
              <p>Pay for {offer.buy_quantity} × {p.name}</p>
              <p>Free item: {offer.get_quantity} × {freeP?.name || p.name}</p>
              <p>Approx. savings: KSh {savingsAmount.toFixed(0)}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] xs:text-xs text-muted-foreground line-through">
            KSh {(p.price * totalQty).toFixed(0)}
          </span>
          <span className="text-sm xs:text-base sm:text-lg font-bold text-primary leading-tight">
            KSh {(p.price * offer.buy_quantity).toFixed(0)}
          </span>
        </div>
      </CardContent>


      <CardFooter className="p-2 xs:p-3 sm:p-4 pt-0">
        <Button
          className="w-full h-8 xs:h-9 sm:h-10 text-[11px] xs:text-xs sm:text-sm transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90 touch-manipulation"
          onClick={handleAdd}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5 xs:h-4 xs:w-4" />
          <span className="hidden xs:inline">Add to Cart</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BogoCard;
