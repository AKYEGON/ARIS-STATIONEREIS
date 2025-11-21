import { Product } from "@/types/product";

interface BrochureProductProps {
  product: Product;
}

const BrochureProduct = ({ product }: BrochureProductProps) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="bg-card border border-border rounded p-2 hover:shadow-md transition-shadow print:shadow-none print:p-1.5 print:rounded-sm flex flex-col print:break-inside-avoid">
      <div className="aspect-square bg-muted rounded mb-1.5 overflow-hidden print:mb-1">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="space-y-1 flex-1 flex flex-col justify-between">
        <h3 className="font-semibold text-[11px] text-foreground leading-snug print:text-[8px] print:leading-tight break-words overflow-visible">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-base font-bold text-primary print:text-[11px]">
            {product.price.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-muted-foreground line-through print:text-[8px]">
              {product.originalPrice?.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrochureProduct;
