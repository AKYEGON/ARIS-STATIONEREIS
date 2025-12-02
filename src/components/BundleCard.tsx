import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bundle } from "@/types/bundle";

interface BundleCardProps {
  bundle: Bundle;
  onAddToCart: (bundle: Bundle) => void;
}

const BundleCard = ({ bundle, onAddToCart }: BundleCardProps) => {
  const savings = bundle.original_total_price - bundle.bundle_price;
  const savingsPercentage = Math.round((savings / bundle.original_total_price) * 100);

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
      <div className="relative overflow-hidden aspect-square">
        <Badge className="absolute top-2 right-2 z-10 bg-primary">
          Save {savingsPercentage}%
        </Badge>
        <img
          src={bundle.image}
          alt={bundle.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg mb-2 line-clamp-2">{bundle.name}</h3>
        {bundle.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {bundle.description}
          </p>
        )}
        {bundle.items && bundle.items.length > 0 && (
          <div className="mb-3 text-xs text-muted-foreground">
            Contains: {bundle.items.map(item => 
              `${item.product?.name || 'Product'} ${item.quantity > 1 ? `(×${item.quantity})` : ''}`
            ).join(', ')}
          </div>
        )}
        <div className="flex items-baseline gap-2 mb-3 mt-auto">
          <span className="text-sm text-muted-foreground line-through">
            KSh {bundle.original_total_price.toFixed(2)}
          </span>
          <span className="text-xl font-bold text-primary">
            KSh {bundle.bundle_price.toFixed(2)}
          </span>
        </div>
        <div className="text-xs font-medium text-green-600 mb-3">
          Save KSh {savings.toFixed(2)}
        </div>
        <Button
          onClick={() => onAddToCart(bundle)}
          className="w-full transition-all duration-200 active:scale-95"
        >
          Add Bundle to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default BundleCard;
