import { Product } from "@/types/product";
import BrochureProduct from "./BrochureProduct";

interface BrochureCategoryProps {
  category: string;
  products: Product[];
}

const BrochureCategory = ({ category, products }: BrochureCategoryProps) => {
  return (
    <section className="mb-12 page-break-inside-avoid print:mb-8">
      <div className="bg-primary text-primary-foreground py-3 px-4 rounded-lg mb-6 print:mb-4">
        <h2 className="text-2xl font-bold print:text-xl">{category}</h2>
        <p className="text-sm opacity-90 mt-1">
          {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        {products.map((product) => (
          <BrochureProduct key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default BrochureCategory;
