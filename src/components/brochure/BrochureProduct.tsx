import { Product } from "@/types/product";

interface BrochureProductProps {
  product: Product;
}

const BrochureProduct = ({ product }: BrochureProductProps) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="bg-card border border-border rounded p-1.5 page-break-inside-avoid hover:shadow-md transition-shadow print:shadow-none print:p-1 print:rounded-sm">
      <div className="aspect-square bg-muted rounded mb-1 overflow-hidden print:mb-0.5">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-0.5">
        <h3 className="font-semibold text-xs text-foreground leading-tight print:text-[9px] print:leading-tight line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1 pt-0.5">
          <span className="text-sm font-bold text-primary print:text-[10px]">
            {product.price.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-[9px] text-muted-foreground line-through print:text-[7px]">
              {product.originalPrice?.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrochureProduct;
