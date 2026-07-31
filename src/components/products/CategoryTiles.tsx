import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import CategoryIcon from "@/components/products/CategoryIcon";
import { useCategoryTree } from "@/hooks/use-category-tree";

/** Visual entry points into the main categories. Data driven, no hardcoded list. */
const CategoryTiles = () => {
  const { data } = useCategoryTree();
  const tree = data?.tree || [];
  if (tree.length === 0) return null;

  return (
    <section aria-labelledby="shop-by-category" className="container px-3 sm:px-4 pb-6">
      <h2 id="shop-by-category" className="mb-3 text-base sm:text-lg font-semibold">
        Shop by category
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {tree.map((main) => (
          <Link
            key={main.id}
            to={`/category/${main.slug}`}
            className="group rounded-xl border border-border bg-card p-3 sm:p-4 transition-colors hover:border-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-background">
              <CategoryIcon name={main.icon} className="h-4.5 w-4.5" />
            </span>
            <span className="mt-2.5 block text-sm font-medium leading-tight">{main.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {main.children.length > 0
                ? `${main.children.length} sections`
                : "Browse"}
            </span>
            <ChevronRight
              className="mt-1 h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryTiles;
