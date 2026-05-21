import { Flame } from "lucide-react";

interface SaleBadgeProps {
  price: number;
  originalPrice?: number | null;
  saleEndsAt?: string | null;
  saleStartsAt?: string | null;
  className?: string;
}

/**
 * Returns true if a product is currently in an active sale window.
 * If no window set, falls back to "has a discount" (originalPrice > price).
 */
export const isOnSale = (
  price: number,
  originalPrice?: number | null,
  saleStartsAt?: string | null,
  saleEndsAt?: string | null,
): boolean => {
  if (!originalPrice || originalPrice <= price) return false;
  const now = Date.now();
  if (saleStartsAt && new Date(saleStartsAt).getTime() > now) return false;
  if (saleEndsAt && new Date(saleEndsAt).getTime() < now) return false;
  return true;
};

const SaleBadge = ({
  price,
  originalPrice,
  saleStartsAt,
  saleEndsAt,
  className = "",
}: SaleBadgeProps) => {
  if (!isOnSale(price, originalPrice, saleStartsAt, saleEndsAt)) return null;
  const pct = Math.round((1 - price / (originalPrice as number)) * 100);

  // Ending soon? <24h
  const endingSoon =
    saleEndsAt &&
    new Date(saleEndsAt).getTime() - Date.now() < 24 * 60 * 60 * 1000 &&
    new Date(saleEndsAt).getTime() - Date.now() > 0;

  return (
    <div className={`absolute top-1.5 left-1.5 z-10 flex flex-col gap-1 ${className}`}>
      <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
        -{pct}%
      </span>
      {endingSoon && (
        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow animate-pulse">
          <Flame className="h-2.5 w-2.5" />
          ENDS SOON
        </span>
      )}
    </div>
  );
};

export default SaleBadge;
