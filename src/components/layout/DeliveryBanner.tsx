import { useState, useEffect } from "react";
import { Truck } from "lucide-react";

interface Props {
  className?: string;
  onOpenDetails?: () => void;
}

export default function DeliveryBanner({ className = "", onOpenDetails }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("aris_delivery_banner_dismissed");
      if (dismissed === "1") setHidden(true);
    } catch (e) {}
  }, []);

  const close = () => {
    setHidden(true);
    try { localStorage.setItem("aris_delivery_banner_dismissed", "1"); } catch (e) {}
  };

  if (hidden) return null;

  return (
    <div className={`w-full bg-gradient-to-r from-emerald-600 to-emerald-700 border-b border-emerald-800 text-white shadow-sm ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start sm:items-center justify-between gap-4">
          {/* Main content */}
          <div className="flex-1 flex items-center gap-3">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold text-base sm:text-lg">FREE DELIVERY</span>
              <span className="text-xs sm:text-sm text-emerald-50">
                within campus areas including <strong>UoN Hostels, Qejani & Qwetu</strong> — no minimum order
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onOpenDetails && onOpenDetails()}
              className="text-xs sm:text-sm font-medium underline hover:no-underline whitespace-nowrap transition-colors hover:text-emerald-100"
              aria-label="View delivery details"
            >
              Details
            </button>

            <button 
              onClick={close} 
              aria-label="Close delivery banner" 
              className="p-1 hover:bg-emerald-800 rounded transition-colors"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
