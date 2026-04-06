import { useState, useEffect } from "react";
import { ProductCategory } from "@/types/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { icons } from "lucide-react";
import { Package } from "lucide-react";

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
}

const CategoryRotator = ({ categories, selectedCategory, onSelectCategory }: CategoryRotatorProps) => {
  const [rotatingIndex, setRotatingIndex] = useState(0);

  useEffect(() => {
    if (categories.length === 0 || selectedCategory !== "all") return;
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % categories.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [categories.length, selectedCategory]);

  if (categories.length === 0) return null;

  const rotatingCat = categories[rotatingIndex];

  return (
    <section className="container px-4 pb-4">
      <div className="max-w-xl mx-auto">
        <Select value={selectedCategory} onValueChange={onSelectCategory}>
          <SelectTrigger className="w-full bg-secondary border-primary/30">
            {selectedCategory === "all" ? (
              <span className="flex items-center gap-2 text-muted-foreground animate-fade-in" key={rotatingIndex}>
                {getLucideIcon(rotatingCat?.icon)}
                <span className="truncate">{rotatingCat?.name || "Browse by category"}</span>
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
    </section>
  );
};

export default CategoryRotator;
