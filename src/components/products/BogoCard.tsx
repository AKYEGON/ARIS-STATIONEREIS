import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, ShoppingCart } from "lucide-react";
import { BogoOffer } from "@/types/bogo";
import { Product } from "@/types/product";

interface BogoCardProps {
  offer: BogoOffer;
  onAddToCart: (product: Product) => void;
}

const BogoCard = ({ offer, onAddToCart }: BogoCardProps) => {
  const p = offer.product;
  const freeP = offer.free_product || offer.product;
  if (!p) return null;

  const sameProduct = !offer.free_product_id || offer.free_product_id === offer.product_id;

  return (
    <Card className="overflow-hidden h-full flex flex-col group hover:shadow-lg transition-all">
      <div className="relative aspect-square bg-white flex items-center justify-center p-2 overflow-hidden">
        <Badge className="absolute top-1.5 left-1.5 z-10 bg-purple-600 text-[10px] flex items-center gap-1">
          <Gift className="h-3 w-3" />
          BOGO
        </Badge>
        {sameProduct ? (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid grid-cols-2 gap-1 w-full h-full">
            <div className="bg-white flex items-center justify-center overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
            </div>
            <div className="bg-emerald-50 flex items-center justify-center overflow-hidden relative">
              <span className="absolute top-1 right-1 text-[8px] font-bold text-emerald-700 bg-emerald-200 rounded px-1">FREE</span>
              <img src={freeP?.image} alt={freeP?.name} className="w-full h-full object-contain p-1" />
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-2 xs:p-3 flex flex-col flex-1">
        <h3 className="font-bold text-xs xs:text-sm line-clamp-2 mb-1">{offer.name}</h3>
        <p className="text-[10px] xs:text-xs text-emerald-700 font-semibold mb-1">
          Buy {offer.buy_quantity}, get {offer.get_quantity} {sameProduct ? "free" : `× ${freeP?.name} free`}
        </p>
        <p className="text-[10px] xs:text-xs text-muted-foreground line-clamp-1 mb-2">{p.name}</p>
        <p className="text-sm xs:text-base font-bold text-primary mt-auto">KSh {p.price.toFixed(0)}</p>
        <Button
          size="sm"
          className="w-full h-8 text-[11px] xs:text-xs mt-2 gap-1.5"
          onClick={() => onAddToCart(p)}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add {offer.buy_quantity} to cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default BogoCard;
