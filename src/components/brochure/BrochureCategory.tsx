import { Product } from "@/types/product";
import BrochureProduct from "./BrochureProduct";

interface BrochureCategoryProps {
  category: string;
  products: Product[];
}

const BrochureCategory = ({ category, products }: BrochureCategoryProps) => {
  return (
    <section className="mb-6 page-break-inside-avoid print:mb-4">
      <div className="bg-primary text-primary-foreground py-2 px-3 rounded mb-3 print:py-1.5 print:mb-2">
        <h2 className="text-lg font-bold print:text-base">{category}</h2>
        <p className="text-xs opacity-90 print:text-[10px]">
          {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 print:grid-cols-6 print:gap-2">
        {products.map((product) => (
          <BrochureProduct key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BrochureCategory;
