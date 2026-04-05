import { useState, useEffect } from "react";
import { ProductCategory } from "@/types/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [rotatingIndex, setRotatingIndex] = useState(0);

  // Auto-rotate the placeholder text when no category is selected
  useEffect(() => {
    if (categories.length === 0 || selectedCategory !== "all") return;
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % categories.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [categories.length, selectedCategory]);

  if (categories.length === 0) return null;

  const rotatingName = categories[rotatingIndex]?.name || "Browse by category";

  return (
    <section className="container px-4 pb-4">
      <div className="max-w-xl mx-auto">
        <Select value={selectedCategory} onValueChange={onSelectCategory}>
          <SelectTrigger className="w-full bg-secondary border-primary/30">
            {selectedCategory === "all" ? (
              <span className="flex items-center gap-2 text-muted-foreground animate-fade-in" key={rotatingIndex}>
                {CATEGORY_ICONS[rotatingName]}
                {rotatingName}
              </span>
            ) : (
              <SelectValue />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                <span className="flex items-center gap-2">
                  {CATEGORY_ICONS[cat.name]}
                  {cat.name}
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
