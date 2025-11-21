import { Product } from "@/types/product";

interface BrochureProductProps {
  product: Product;
}

const BrochureProduct = ({ product }: BrochureProductProps) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="bg-card border border-border rounded p-2 page-break-inside-avoid hover:shadow-md transition-shadow print:shadow-none print:p-1.5 print:rounded-sm">
      <div className="aspect-square bg-muted rounded mb-1.5 overflow-hidden print:mb-1">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground leading-tight print:text-xs print:leading-tight">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 print:text-[10px] print:leading-tight">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-base font-bold text-primary print:text-sm">
            Ksh {product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-muted-foreground line-through print:text-[9px]">
              Ksh {product.originalPrice?.toFixed(2)}
            </span>
          )}
        </div>

        {hasDiscount && (
          <div className="inline-block">
            <span className="bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded print:text-[8px] print:px-1">
              Save Ksh {((product.originalPrice || 0) - product.price).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrochureProduct;
