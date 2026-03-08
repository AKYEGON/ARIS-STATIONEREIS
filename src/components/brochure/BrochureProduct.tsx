import { Product } from "@/types/product";

interface BrochureProductProps {
  product: Product;
}

const BrochureProduct = ({ product }: BrochureProductProps) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="product-card bg-card border border-border rounded p-2 hover:shadow-md transition-shadow print:shadow-none print:p-1 print:rounded-sm flex flex-col print:break-inside-avoid print:border-muted">
      <div className="aspect-square bg-muted rounded mb-1.5 overflow-hidden print:mb-0.5 print:aspect-auto print:h-16">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="space-y-1 flex-1 flex flex-col justify-between print:space-y-0">
        <h3 className="font-semibold text-[11px] text-foreground leading-snug print:text-[8px] print:leading-tight break-words overflow-visible hyphens-auto">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 pt-1 print:pt-0">
          <span className="text-base font-bold text-primary print:text-[9px]">
            {product.price.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-muted-foreground line-through print:text-[7px]">
              {product.originalPrice?.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrochureProduct;
