import { useState, useEffect } from "react";

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
    <div className={`w-full text-sm sm:text-base bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200 text-emerald-900 ${className}`}>
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <strong className="text-emerald-800">FREE DELIVERY</strong>
          <span>
            to <strong>UoN hostels</strong>, <strong>Qejani</strong> & <strong>Qwetu</strong> — <strong>no minimum</strong>.
          </span>
          <span className="hidden sm:inline">Other areas: free for KSH 500+ (otherwise fee negotiated). Payment on pickup/delivery.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDetails && onOpenDetails()}
            className="text-sm underline hover:no-underline"
            aria-label="Delivery details"
          >
            Delivery details
          </button>

          <button onClick={close} aria-label="Close delivery banner" className="p-1">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
