import { icons, Package } from "lucide-react";

interface CategoryIconProps {
  name: string | null;
  className?: string;
}

/** Renders a Lucide icon by name, an emoji, or a neutral fallback. */
const CategoryIcon = ({ name, className = "h-4 w-4" }: CategoryIconProps) => {
  if (!name) return <Package className={className} aria-hidden="true" />;
  if (/[^\x00-\x7F]/.test(name)) return <span aria-hidden="true">{name}</span>;
  const Comp = (icons as Record<string, any>)[name];
  return Comp ? <Comp className={className} aria-hidden="true" /> : <Package className={className} aria-hidden="true" />;
};

export default CategoryIcon;
