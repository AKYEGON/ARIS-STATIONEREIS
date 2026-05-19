import { Bundle } from "@/types/bundle";

interface BundleCollageProps {
  bundle: Bundle;
  className?: string;
}

/**
 * Renders a collage from a bundle's included product images.
 * Used when bundle.image is empty/falsy.
 */
const BundleCollage = ({ bundle, className = "" }: BundleCollageProps) => {
  const imgs = (bundle.items || [])
    .map((i) => i.product?.image)
    .filter(Boolean)
    .slice(0, 4) as string[];

  if (imgs.length === 0) {
    return (
      <div className={`w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground ${className}`}>
        Bundle
      </div>
    );
  }

  if (imgs.length === 1) {
    return (
      <img
        src={imgs[0]}
        alt={bundle.name}
        loading="lazy"
        className={`w-full h-full object-contain bg-white p-2 ${className}`}
      />
    );
  }

  const gridCls =
    imgs.length === 2
      ? "grid-cols-2 grid-rows-1"
      : imgs.length === 3
        ? "grid-cols-2 grid-rows-2"
        : "grid-cols-2 grid-rows-2";

  return (
    <div className={`grid ${gridCls} gap-0.5 w-full h-full bg-white ${className}`}>
      {imgs.map((src, i) => (
        <div
          key={i}
          className={`bg-white overflow-hidden flex items-center justify-center ${
            imgs.length === 3 && i === 0 ? "row-span-2" : ""
          }`}
        >
          <img
            src={src}
            alt={`${bundle.name} item ${i + 1}`}
            loading="lazy"
            className="w-full h-full object-contain p-1"
          />
        </div>
      ))}
    </div>
  );
};

export default BundleCollage;
