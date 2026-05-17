// Static category selector
import { ProductCategory } from "@/types/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Package, icons } from "lucide-react";

const getLucideIcon = (iconName: string | null, className = "h-4 w-4 shrink-0") => {
  if (!iconName) return <Package className={className} />;
  
  // Check if it's an emoji (non-ASCII character)
  if (/[^\x00-\x7F]/.test(iconName)) {
    return <span className="text-sm shrink-0">{iconName}</span>;
  }

  // Try to find the Lucide icon by name (PascalCase)
  const IconComponent = (icons as Record<string, any>)[iconName];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback
  return <Package className={className} />;
};

interface CategoryRotatorProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  useNativeSelectOnMobile?: boolean;
}

const CategoryRotator = ({
  categories,
  selectedCategory,
  onSelectCategory,
  useNativeSelectOnMobile = false,
}: CategoryRotatorProps) => {
  if (categories.length === 0) return null;

  const selectedCategoryData = categories.find((cat) => cat.name === selectedCategory);

  return (
    <section className="container px-4 pb-4">
      <div className="max-w-xl mx-auto">
        {useNativeSelectOnMobile && (
          <div className="md:hidden">
            <label htmlFor="mobile-category-select" className="sr-only">
              Browse by category
            </label>
            <select
              id="mobile-category-select"
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className={cn(
                "h-10 w-full rounded-md border border-primary/30 bg-secondary px-3 text-sm text-foreground outline-none",
                "focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              )}
            >
              <option value="all">Browse by category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={cn(useNativeSelectOnMobile && "hidden md:block")}>
          <Select value={selectedCategory} onValueChange={onSelectCategory}>
            <SelectTrigger className="w-full bg-secondary border-primary/30 [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2">
              {selectedCategory === "all" ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4 shrink-0" />
                  <span className="truncate">Browse by category</span>
                </span>
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>All Categories</span>
                </span>
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  <span className="flex items-center gap-2">
                    {getLucideIcon(cat.icon)}
                    <span>{cat.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default CategoryRotator;
