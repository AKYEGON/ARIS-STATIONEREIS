import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, ShoppingCart } from "lucide-react";
import { BogoOffer } from "@/types/bogo";
import { Product } from "@/types/product";

interface BogoCardProps {
  offer: BogoOffer;
  onAddToCart: (product: Product) => void;
}

/**
 * Compact BOGO tile. The whole card links to the qualifying product's detail
 * page; the inline Add button stops propagation so customers can also add to
 * cart directly without leaving the listing.
 */
const BogoCard = ({ offer, onAddToCart }: BogoCardProps) => {
  const p = offer.product;
  const freeP = offer.free_product || offer.product;
  if (!p) return null;

  const sameProduct = !offer.free_product_id || offer.free_product_id === offer.product_id;
  const href = p.slug ? `/product/${p.slug}` : `/product/${p.id}`;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(p);
  };

  return (
    <Link to={href} className="block h-full group">
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-all">
        <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden">
          <Badge className="absolute top-1.5 left-1.5 z-20 bg-purple-600 text-[10px] flex items-center gap-1 shadow">
            <Gift className="h-3 w-3" />
            BOGO
          </Badge>
          {sameProduct ? (
            <>
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
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
                <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
              </div>
              <div className="bg-emerald-50 flex items-center justify-center overflow-hidden p-1.5 relative">
                <span className="absolute top-1 left-1 text-[9px] font-extrabold text-white bg-emerald-600 rounded px-1.5 py-0.5 shadow">
                  FREE ×{offer.get_quantity}
                </span>
                <img src={freeP?.image} alt={freeP?.name} className="w-full h-full object-contain" />
              </div>
            </div>
          )}
        </div>
        <div className="p-2 flex flex-col gap-0.5">
          <h3 className="font-bold text-xs xs:text-sm line-clamp-1">{offer.name}</h3>
          <p className="text-[10px] xs:text-xs text-emerald-700 font-semibold line-clamp-1">
            Buy {offer.buy_quantity}, get {offer.get_quantity} {sameProduct ? "free" : `× ${freeP?.name} free`}
          </p>
          <p className="text-sm font-bold text-primary">KSh {p.price.toFixed(0)}</p>
          <Button
            size="sm"
            className="w-full h-8 text-[11px] xs:text-xs mt-1.5 gap-1.5"
            onClick={handleAdd}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add {offer.buy_quantity} to cart
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export default BogoCard;
