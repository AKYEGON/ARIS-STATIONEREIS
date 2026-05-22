import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift } from "lucide-react";
import { EarnedBogo } from "@/hooks/use-bogo";

interface BogoFreebiesBannerProps {
  earned: EarnedBogo[];
}

/**
 * Shown inside the cart when one or more BOGO offers have been unlocked
 * by the qualifying products currently in the cart. The freebies are
 * informational on the client and are added to the WhatsApp order
 * message so the order desk fulfils them.
 */
const BogoFreebiesBanner = ({ earned }: BogoFreebiesBannerProps) => {
  if (earned.length === 0) return null;

  const totalSaved = earned.reduce(
    (sum, e) => sum + e.freeProduct.price * e.freeQty,
    0,
  );

  return (
    <Card className="border-2 border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-emerald-600 text-white p-1.5 rounded-md">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-900 dark:text-emerald-100">
              Free items unlocked
            </h3>
            <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-200/80">
              You save KSh {totalSaved.toFixed(0)} — added to your order automatically
            </p>
          </div>
        </div>
        <ul className="space-y-1.5">
          {earned.map(({ offer, freeQty, freeProduct }) => (
            <li
              key={offer.id}
              className="flex items-center gap-2 text-xs sm:text-sm bg-background/60 rounded-md p-2"
            >
              <img
                src={freeProduct.image}
                alt={freeProduct.name}
                className="h-9 w-9 object-contain bg-white rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{freeProduct.name}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1">
                  {offer.name}
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                FREE × {freeQty}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default BogoFreebiesBanner;
