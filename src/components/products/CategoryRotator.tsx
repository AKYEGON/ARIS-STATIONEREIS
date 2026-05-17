// Static category selector
import { ProductCategory } from "@/types/product";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Package, ChevronRight, icons } from "lucide-react";
import { useState } from "react";

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
          <MobileVerticalRotator
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
          />
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

interface MobileVerticalRotatorProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const MobileVerticalRotator = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: MobileVerticalRotatorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const items = [
    { id: "__all__", name: "all", label: "All Categories", icon: null as string | null },
    ...categories.map((c) => ({ id: c.id, name: c.name, label: c.name, icon: c.icon })),
  ];

  const HEIGHT = 44;
  const hasSelection = selectedCategory !== "all";
  // Stop rotation when user picked a category, when paused, or while scrolling manually
  const shouldAnimate = !hasSelection && !isPaused;
  const durationS = Math.max(items.length * 4, 24);

  // When user picks a category, scroll it into view
  useEffect(() => {
    if (!hasSelection || !scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLButtonElement>(
      `[data-cat-name="${CSS.escape(selectedCategory)}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedCategory, hasSelection]);

  return (
    <div className="md:hidden">
      <div
        ref={scrollRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-md border border-primary/20 bg-background no-scrollbar"
        style={{ height: HEIGHT, WebkitOverflowScrolling: "touch" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
      >
        <div
          className="flex w-max h-full will-change-transform"
          style={
            shouldAnimate
              ? {
                  animation: `horizontal-marquee ${durationS}s linear infinite`,
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }
              : undefined
          }
        >
          {(shouldAnimate ? [...items, ...items] : items).map((it, idx) => {
            const isActive = selectedCategory === it.name;
            return (
              <button
                key={`${it.id}-${idx}`}
                type="button"
                data-cat-name={it.name}
                onClick={() => onSelectCategory(it.name)}
                className={cn(
                  "flex items-center gap-2 px-3 text-sm border-r-2 border-primary transition-colors shrink-0 h-full",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground"
                )}
              >
                {it.name === "all" ? (
                  <Package className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  getLucideIcon(it.icon)
                )}
                <span className="whitespace-nowrap">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryRotator;
