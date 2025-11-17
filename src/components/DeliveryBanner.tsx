import { useState, useEffect } from "react";
import { Truck, MapPin } from "lucide-react";

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
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            {/* Free delivery section */}
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-bold text-base sm:text-lg">FREE DELIVERY</span>
                <span className="text-xs sm:text-sm text-emerald-100">
                  UoN Hostels, Qejani & Qwetu
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-6 w-px bg-emerald-400"></div>

            {/* Other areas section */}
            <div className="flex items-start gap-2 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="text-emerald-50">
                <span className="font-semibold">Other areas:</span> Free on orders KSh 500+
              </div>
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
