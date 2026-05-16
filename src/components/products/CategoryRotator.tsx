import { useState, useEffect, useRef } from "react";
import { ProductCategory } from "@/types/product";
import { icons, Package } from "lucide-react";

/* ── Icon resolver ─────────────────────────────────────────────── */
const getLucideIcon = (iconName: string | null, size = 14) => {
  if (!iconName) return <Package style={{ width: size, height: size, flexShrink: 0 }} />;

  // Emoji / non-ASCII
  if (/[^\x00-\x7F]/.test(iconName)) {
    return <span style={{ fontSize: size + 2, lineHeight: 1, flexShrink: 0 }}>{iconName}</span>;
  }

  const IconComponent = (icons as Record<string, any>)[iconName];
  if (IconComponent) return <IconComponent style={{ width: size, height: size, flexShrink: 0 }} />;
  return <Package style={{ width: size, height: size, flexShrink: 0 }} />;
};

/* ── Props ─────────────────────────────────────────────────────── */
interface CategoryRotatorProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

/* ── Component ─────────────────────────────────────────────────── */
const CategoryRotator = ({ categories, selectedCategory, onSelectCategory }: CategoryRotatorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  // Rotate label when "all" is selected
  useEffect(() => {
    if (categories.length === 0 || selectedCategory !== "all") return;
    const id = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % categories.length);
    }, 2600);
    return () => clearInterval(id);
  }, [categories.length, selectedCategory]);

  // Auto-scroll active pill into view
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector("[data-active='true']") as HTMLElement | null;
    if (active) {
      const containerRect = container.getBoundingClientRect();
      const pillRect = active.getBoundingClientRect();
      const offset =
        pillRect.left - containerRect.left - containerRect.width / 2 + pillRect.width / 2;
      container.scrollBy({ left: offset, behavior: "smooth" });
    }
  }, [selectedCategory]);

  if (categories.length === 0) return null;

  const allCategories = [{ id: "all", name: "All Products", icon: null }, ...categories];

  return (
    <div 
      className="sticky top-[50px] md:top-[65px] z-40 w-full border-b border-[#DDE8DF]/60 bg-white/80 backdrop-blur-md transition-all duration-300 shadow-[0_4px_12px_rgba(92,122,95,0.03)]"
    >
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {allCategories.map((cat) => {
            const isActive = cat.id === "all"
              ? selectedCategory === "all"
              : selectedCategory === cat.name;

            return (
              <button
                key={cat.id}
                data-active={isActive}
                onClick={() => onSelectCategory(cat.id === "all" ? "all" : cat.name)}
                className={`
                  flex items-center gap-2 whitespace-nowrap flex-shrink-0 
                  rounded-full px-4 py-1.5 text-xs font-semibold 
                  transition-all duration-200 transform active:scale-[0.97]
                  ${
                    isActive
                      ? "bg-[#2C3E35] text-white border border-[#2C3E35] shadow-sm shadow-[#2C3E35]/10"
                      : "bg-[#F4F7F5]/40 text-[#4A5C50] border border-[#DDE8DF]/80 hover:border-[#7A9E7E] hover:text-[#2C3E35] hover:bg-white"
                  }
                `}
              >
                {cat.id === "all" ? (
                  /* Rotating preview when "All" is selected */
                  isActive && selectedCategory === "all" ? (
                    <div className="flex items-center gap-1.5">
                      <span className="opacity-70">All</span>
                      <span
                        className="flex items-center gap-1 animate-fade-in text-[#A8C5AB] text-[11px]"
                        key={rotatingIndex}
                      >
                        • {getLucideIcon(categories[rotatingIndex]?.icon, 12)}
                        {categories[rotatingIndex]?.name}
                      </span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                      All Products
                    </span>
                  )
                ) : (
                  <>
                    {getLucideIcon(cat.icon, 14)}
                    {cat.name}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryRotator;