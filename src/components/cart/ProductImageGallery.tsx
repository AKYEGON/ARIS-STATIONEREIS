import { useState } from "react";
import { ProductMedia } from "@/types/product";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  primaryImage: string;
  productName: string;
  media?: ProductMedia[];
}

const ProductImageGallery = ({ primaryImage, productName, media }: ProductImageGalleryProps) => {
  // Combine primary image with additional images
  const allImages = [
    primaryImage,
    ...(media?.filter(m => m.media_type === 'image').map(m => m.media_url) || [])
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  if (allImages.length === 1) {
    // Single image - no gallery needed
    return (
      <img
        src={primaryImage}
        alt={productName}
        loading="lazy"
        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded transition-transform duration-200 hover:scale-105"
      />
    );
  }

  return (
    <div className="relative">
      {/* Main Image */}
      <div 
        className="relative w-20 h-20 sm:w-24 sm:h-24"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={allImages[currentImageIndex]}
          alt={`${productName} - Image ${currentImageIndex + 1}`}
          loading="lazy"
          className="w-full h-full object-cover rounded transition-transform duration-200"
        />

        {/* Navigation Arrows (on hover) */}
        {isHovered && allImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-r transition-all"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-l transition-all"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        {allImages.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {currentImageIndex + 1}/{allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="flex gap-1 mt-1 overflow-x-auto max-w-[80px] sm:max-w-[96px] hide-scrollbar">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded border-2 transition-all ${
                index === currentImageIndex
                  ? 'border-primary scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover rounded"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
