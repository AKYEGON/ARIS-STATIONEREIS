import { Product } from "@/types/product";

interface BrochureProductProps {
  product: Product;
}

const BrochureProduct = ({ product }: BrochureProductProps) => {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="bg-card border border-border rounded-lg p-4 page-break-inside-avoid hover:shadow-lg transition-shadow print:shadow-none print:p-3">
      <div className="aspect-square bg-muted rounded-md mb-3 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div>
        <h3 className="font-semibold text-lg text-foreground mb-1 print:text-base">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 print:text-xs">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary print:text-xl">
            Ksh {product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through print:text-xs">
              Ksh {product.originalPrice?.toFixed(2)}
            </span>
          )}
        </div>

        {hasDiscount && (
          <div className="mt-2 inline-block">
            <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded print:text-[10px]">
              Save Ksh {((product.originalPrice || 0) - product.price).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrochureProduct;
