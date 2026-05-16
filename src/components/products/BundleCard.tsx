import { useState, useEffect } from "react";
import { Plus, X, ShoppingBag, Check, HelpCircle } from "lucide-react";
import { Bundle } from "@/types/bundle";

interface BundleCardProps {
  bundle: Bundle;
  onAddToCart: (bundle: Bundle) => void;
  compact?: boolean;
}

const BundleCard = ({ bundle, onAddToCart, compact = false }: BundleCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Fallback calculations matching your previous structure safely
  const bPrice = bundle.bundle_price;
  const oPrice = bundle.original_total_price;
  const savings = oPrice - bPrice;
  const savingsPercentage = oPrice > 0 ? Math.round((savings / oPrice) * 100) : 0;

  // Sync window overflow styling when glass modal mounts
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isModalOpen]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open modal if fired from underlying surfaces
    onAddToCart(bundle);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <>
      {/* ── 1. The Luxury Display Card ── */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group relative flex flex-col h-full bg-white border border-[#DDE8DF]/60 rounded-sm overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-[0_12px_30px_-6px_rgba(92,122,95,0.08)]"
      >
        {/* Media Window - Elegant 3:4 Aspect Portrait Ratio */}
        <div className="relative aspect-[3/4] w-full bg-[#F4F7F5] overflow-hidden">
          {bundle.image ? (
            <img
              src={bundle.image}
              alt={`${bundle.name} — Luxury Collection`}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A8C5AB]">
              <span className="font-serif italic text-xs tracking-wider">Aris Collection</span>
            </div>
          )}

          {/* Luxury Hover Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Quick View Interactive Action Drawer */}
          <div className="absolute bottom-4 left-4 right-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <button className="w-full py-3 bg-white/95 backdrop-blur-sm text-[#2C3E35] text-[11px] font-bold tracking-[0.2em] uppercase rounded-none flex items-center justify-center gap-2 transition-colors hover:bg-[#2C3E35] hover:text-white shadow-md">
              <Plus className="w-3.5 h-3.5" />
              Quick View
            </button>
          </div>
          
          {/* Discount Minimal Badge */}
          {savingsPercentage > 0 && (
            <div className="absolute top-3 left-3 bg-[#2C3E35] text-white text-[9px] font-bold tracking-widest px-2 py-1 uppercase rounded-none shadow-sm">
              Save {savingsPercentage}%
            </div>
          )}
        </div>

        {/* Content Meta Information */}
        <div className="flex flex-col flex-1 p-4 text-center items-center gap-1.5">
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#7A9E7E]">
            Curated Set
          </p>
          
          <h3 className="text-sm font-serif text-[#2C3E35] font-medium leading-snug line-clamp-2 max-w-[90%]">
            {bundle.name}
          </h3>

          {/* Dynamic Pricing Metadata Line */}
          <div className="flex items-baseline justify-center gap-2 mt-auto pt-1">
            <span className="text-sm font-semibold text-[#2C3E35]">
              KSh {bPrice.toLocaleString()}
            </span>
            {savingsPercentage > 0 && (
              <span className="text-xs text-[#A8B8AA] line-through">
                KSh {oPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. The Editorial Quick-Add Modal Overlay ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
          {/* Blur Darkened Backdrop Matrix */}
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-[#1e2b25]/50 backdrop-blur-md"
          />

          {/* Main Structural Display Frame */}
          <div className="relative w-full max-w-4xl max-h-[85vh] md:max-h-[640px] bg-white rounded-none shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 animate-slide-up">
            
            {/* Native Window Close Button Anchor */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-[#2C3E35] border border-[#DDE8DF]/40 hover:bg-[#2C3E35] hover:text-white transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column Aspect: Premium Portfolio Art Canvas */}
            <div className="w-full md:w-1/2 h-[35vh] md:h-full bg-[#F4F7F5] relative">
              {bundle.image ? (
                <img
                  src={bundle.image}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#A8C5AB]" />
              )}
            </div>

            {/* Right Column Aspect: Curated Context Details & Collection Breakdown */}
            <div className="w-full md:w-1/2 flex flex-col p-6 sm:p-8 md:p-10 overflow-y-auto max-h-[50vh] md:max-h-full">
              <div className="mb-6">
                <p className="text-[#7A9E7E] text-[10px] font-bold uppercase tracking-[0.25em] mb-2">
                  ARIS Exclusive Bundle
                </p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-[#2C3E35] font-medium leading-tight mb-3">
                  {bundle.name}
                </h2>
                
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-xl font-medium text-[#2C3E35]">
                    KSh {bPrice.toLocaleString()}
                  </span>
                  {savingsPercentage > 0 && (
                    <span className="text-sm text-[#A8B8AA] line-through">
                      KSh {oPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <p className="text-[#4A5C50] text-xs leading-relaxed font-normal">
                  {bundle.description || "A masterfully matched suite of structural stationery accessories crafted to organize workflows and elevate clean tactile desktop execution daily."}
                </p>
              </div>

              {/* Composition Matrix Breakdown */}
              <div className="flex-grow mb-8">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#2C3E35] border-b border-[#DDE8DF]/80 pb-2 mb-3">
                  Collection Manifest
                </h4>
                {bundle.items && bundle.items.length > 0 ? (
                  <ul className="space-y-2.5">
                    {bundle.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs text-[#4A5C50]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7A9E7E] mt-1.5 flex-shrink-0" />
                        <span className="font-semibold text-[#2C3E35] flex-shrink-0">{item.quantity} ×</span>
                        <span className="leading-tight">{item.product?.name || "Premium Asset Item"}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-[#7A8C80]">
                    Inquire directly regarding custom toolset parameters within this configuration.
                  </p>
                )}
              </div>

              {/* Direct Add to Cart Action Pipeline */}
              <button
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`w-full py-3.5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 rounded-none ${
                  isAdded 
                    ? "bg-[#5C7A5F] text-white cursor-default" 
                    : "bg-[#2C3E35] text-white hover:bg-[#1f2d26] active:scale-[0.99]"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Desk
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add Collection
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default BundleCard;