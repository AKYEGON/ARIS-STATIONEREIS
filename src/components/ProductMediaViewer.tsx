import { useState, useEffect } from "react";
import { Product, ProductMedia } from "@/types/product";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductMediaViewerProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const ProductMediaViewer = ({ product, open, onClose }: ProductMediaViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine primary image with additional media
  const allMedia = [
    { type: 'image' as const, url: product.image },
    ...(product.media?.map(m => ({ type: m.media_type, url: m.media_url })) || [])
  ];

  const currentMedia = allMedia[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, currentIndex]);

  // Reset to first media when opening
  useEffect(() => {
    if (open) setCurrentIndex(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Product info */}
          <div className="absolute top-4 left-4 z-20 text-white max-w-md">
            <h2 className="font-bold text-lg md:text-xl mb-1">{product.name}</h2>
            <p className="text-sm md:text-base font-semibold text-primary">
              KSh {product.price.toFixed(2)}
            </p>
          </div>

          {/* Media counter */}
          {allMedia.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              {currentIndex + 1} / {allMedia.length}
            </div>
          )}

          {/* Main media display */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
            {currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={`${product.name} - Media ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={currentMedia.url}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            )}
          </div>

          {/* Navigation arrows */}
          {allMedia.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-10 w-10 md:h-12 md:w-12"
              >
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-10 w-10 md:h-12 md:w-12"
              >
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
            </>
          )}

          {/* Thumbnail strip */}
          {allMedia.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 px-4 py-2 bg-black/70 rounded-lg overflow-x-auto max-w-[90vw] hide-scrollbar">
              {allMedia.map((media, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded border-2 transition-all ${
                    index === currentIndex
                      ? 'border-primary scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                      <span className="text-xs">▶️</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-24 left-0 right-0 text-center text-white/60 text-xs md:text-sm">
            <p className="hidden md:block">← → Arrow keys to navigate • ESC to close</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductMediaViewer;
