import { useState, useEffect, useCallback } from "react";
import { CustomerTestimonial } from "@/types/testimonial";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";

interface StoriesCarouselProps {
  testimonials: CustomerTestimonial[];
  initialIndex?: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

const StoriesCarousel = ({ testimonials, initialIndex = 0, onClose }: StoriesCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: initialIndex,
    dragFree: false
  });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentTestimonial = testimonials[currentIndex];

  // Auto-advance functionality
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < testimonials.length - 1) {
            emblaApi?.scrollNext();
          } else {
            onClose();
          }
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, testimonials.length, emblaApi, onClose]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // Update current index when carousel changes
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      emblaApi?.scrollPrev();
    }
  }, [emblaApi, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < testimonials.length - 1) {
      emblaApi?.scrollNext();
    } else {
      onClose();
    }
  }, [emblaApi, currentIndex, testimonials.length, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
    if (e.key === " ") {
      e.preventDefault();
      setIsPaused((prev) => !prev);
    }
  }, [handlePrevious, handleNext, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentTestimonial) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars at top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {testimonials.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%"
              }}
            />
          </div>
        ))}
      </div>

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            <img
              src={currentTestimonial.customer_photo}
              alt={currentTestimonial.customer_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-white">
            <p className="font-semibold text-sm">{currentTestimonial.customer_name}</p>
            {currentTestimonial.product_name && (
              <p className="text-xs opacity-80">{currentTestimonial.product_name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPaused(!isPaused)}
            className="text-white hover:bg-white/20"
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main carousel */}
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {testimonials.map((testimonial, idx) => (
            <div key={testimonial.id} className="flex-[0_0_100%] min-w-0 h-full relative">
              {/* Background image with overlay */}
              <div className="absolute inset-0">
                <img
                  src={testimonial.customer_photo}
                  alt={testimonial.customer_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
              </div>

              {/* Content overlay */}
              <div className="relative h-full flex flex-col justify-end p-6 pb-20">
                <div className="max-w-2xl">
                  <p className="text-white text-lg md:text-2xl leading-relaxed mb-4">
                    "{testimonial.review_text}"
                  </p>
                </div>
              </div>

              {/* Video overlay if exists */}
              {testimonial.video_url && idx === currentIndex && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <video
                    src={testimonial.video_url}
                    className="max-w-full max-h-full"
                    controls
                    autoPlay
                    onPlay={() => setIsPaused(true)}
                    onPause={() => setIsPaused(false)}
                    onEnded={() => setIsPaused(false)}
                  />
                </div>
              )}

              {/* Click areas for navigation */}
              <div className="absolute inset-y-0 left-0 w-1/3" onClick={handlePrevious} />
              <div className="absolute inset-y-0 right-0 w-1/3" onClick={handleNext} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows (desktop only) */}
      <div className="hidden md:flex absolute inset-y-0 left-4 items-center z-10">
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="text-white hover:bg-white/20 h-12 w-12"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
      </div>
      
      <div className="hidden md:flex absolute inset-y-0 right-4 items-center z-10">
        {currentIndex < testimonials.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="text-white hover:bg-white/20 h-12 w-12"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      {/* Bottom instruction text */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-xs md:text-sm">
        <p className="md:hidden">Tap sides to navigate • Tap center to pause</p>
        <p className="hidden md:block">Click sides to navigate • Space to pause • ESC to close</p>
      </div>
    </div>
  );
};

export default StoriesCarousel;
