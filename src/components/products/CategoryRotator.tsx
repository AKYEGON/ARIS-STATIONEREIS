import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductCategory } from "@/types/product";
import {
  Ruler, Calculator, PenTool, BookOpen, FolderOpen,
  Palette, Paperclip, ClipboardCheck, Gift, Package
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Engineering & Drawing": <Ruler className="h-4 w-4" />,
  "Scientific Calculators": <Calculator className="h-4 w-4" />,
  "Writing Instruments": <PenTool className="h-4 w-4" />,
  "Notebooks & Papers": <BookOpen className="h-4 w-4" />,
  "Filing & Organization": <FolderOpen className="h-4 w-4" />,
  "Art & Craft Supplies": <Palette className="h-4 w-4" />,
  "Office Supplies": <Paperclip className="h-4 w-4" />,
  "Exam Essentials": <ClipboardCheck className="h-4 w-4" />,
  "Gifts & Accessories": <Gift className="h-4 w-4" />,
  "General Stationery": <Package className="h-4 w-4" />,
};

interface CategoryRotatorProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryRotator = ({ categories, selectedCategory, onSelectCategory }: CategoryRotatorProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Auto-rotate highlighted category every 2.5 seconds (only when no category is actively selected)
  useEffect(() => {
    if (categories.length === 0 || selectedCategory !== "all") return;
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => (prev + 1) % categories.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [categories.length, selectedCategory]);

  if (categories.length === 0) return null;

  return (
    <section className="container px-4 pb-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Browse Categories</span>
          {selectedCategory !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
              onClick={() => onSelectCategory("all")}
            >
              Clear filter ×
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {categories.map((cat, index) => {
            const isActive = selectedCategory === cat.name;
            const isHighlighted = selectedCategory === "all" && index === highlightedIndex;

            return (
              <Button
                key={cat.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onSelectCategory(isActive ? "all" : cat.name)}
                className={`
                  h-8 text-xs sm:text-sm transition-all duration-500 ease-in-out
                  ${isHighlighted && !isActive
                    ? "border-primary/60 bg-primary/10 text-primary scale-105 shadow-sm"
                    : ""
                  }
                  ${isActive ? "scale-105 shadow-md" : ""}
                `}
              >
                <span className="flex items-center gap-1.5">
                  {CATEGORY_ICONS[cat.name]}
                  {cat.name}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryRotator;
