import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CustomerTestimonial } from "@/types/testimonial";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import { supabase } from "@/integrations/supabase/client";

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

interface StoriesCarouselProps {
  testimonials: CustomerTestimonial[];
  initialIndex?: number;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per image story

// Helper function to expand testimonials with both photo and video into separate slides
const expandTestimonials = (testimonials: CustomerTestimonial[]) => {
  const expanded: Array<CustomerTestimonial & { slideType?: 'photo' | 'video' }> = [];
  
  testimonials.forEach((testimonial) => {
    if (testimonial.video_url) {
      // If testimonial has video, create photo slide first, then video slide
      expanded.push({
        ...testimonial,
        slideType: 'photo',
        video_url: undefined, // Remove video URL for photo slide
      });
      expanded.push({
        ...testimonial,
        slideType: 'video',
      });
    } else {
      // Photo-only testimonial
      expanded.push({
        ...testimonial,
        slideType: 'photo',
      });
    }
  });
  
  return expanded;
};

const StoriesCarousel = ({ testimonials, initialIndex = 0, onClose }: StoriesCarouselProps) => {
  const expandedTestimonials = useMemo(() => expandTestimonials(testimonials), [testimonials]);
  
  // Hide bottom nav when stories are open
  useEffect(() => {
    document.body.classList.add('stories-open');
    return () => document.body.classList.remove('stories-open');
  }, []);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: initialIndex,
    dragFree: false
  });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const viewStartTimeRef = useRef<number>(Date.now());
  const viewedStoriesRef = useRef<Set<string>>(new Set());
  const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const currentTestimonial = expandedTestimonials[currentIndex];
  const isVideoStory = currentTestimonial?.slideType === 'video';

  // Track view when story is displayed
  const trackView = useCallback(async (testimonial: CustomerTestimonial, completed: boolean) => {
    const viewDuration = Date.now() - viewStartTimeRef.current;
    
    try {
      await supabase.functions.invoke('track-story-view', {
        body: {
          testimonialId: testimonial.id,
          completed,
          viewDuration,
          sessionId: sessionIdRef.current
        }
      });
      
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }, []);

  // Track view when entering a new story
  useEffect(() => {
    if (currentTestimonial && !viewedStoriesRef.current.has(currentTestimonial.id)) {
      viewedStoriesRef.current.add(currentTestimonial.id);
      viewStartTimeRef.current = Date.now();
      trackView(currentTestimonial, false);
    }
  }, [currentTestimonial, trackView]);

  // Auto-advance functionality for IMAGE stories only
  useEffect(() => {
    if (isPaused || isVideoStory) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Track completed view before moving to next
          if (currentTestimonial) {
            trackView(currentTestimonial, true);
          }
          
          // Move to next story
          if (currentIndex < expandedTestimonials.length - 1) {
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
  }, [currentIndex, isPaused, isVideoStory, expandedTestimonials.length, emblaApi, onClose, currentTestimonial, trackView]);

  // Reset progress and video ref when story changes
  useEffect(() => {
    setProgress(0);
    setVideoDuration(0);
    videoRef.current = null;
  }, [currentIndex]);

  // Handle video time updates for progress sync
  const handleVideoTimeUpdate = useCallback((video: HTMLVideoElement) => {
    if (video.duration && !isPaused) {
      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(currentProgress);
    }
  }, [isPaused]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    if (currentTestimonial) {
      trackView(currentTestimonial, true);
    }
    
    // Move to next story
    if (currentIndex < expandedTestimonials.length - 1) {
      emblaApi?.scrollNext();
    } else {
      onClose();
    }
  }, [currentTestimonial, currentIndex, expandedTestimonials.length, emblaApi, onClose, trackView]);

  // Handle pause/play for videos
  const togglePause = useCallback(() => {
    if (isVideoStory && videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
    setIsPaused(!isPaused);
  }, [isPaused, isVideoStory]);

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
    if (currentIndex < expandedTestimonials.length - 1) {
      emblaApi?.scrollNext();
    } else {
      onClose();
    }
  }, [emblaApi, currentIndex, expandedTestimonials.length, onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
    if (e.key === " ") {
      e.preventDefault();
      togglePause();
    }
  }, [handlePrevious, handleNext, onClose, togglePause]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentTestimonial) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars at top */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {expandedTestimonials.map((_, idx) => (
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
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            {currentTestimonial.customer_photo ? (
              <img
                src={currentTestimonial.customer_photo}
                alt={currentTestimonial.customer_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(currentTestimonial.customer_name)}
              </div>
            )}
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
            onClick={togglePause}
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
          {expandedTestimonials.map((testimonial, idx) => (
            <div key={testimonial.id} className="flex-[0_0_100%] min-w-0 h-full relative bg-black">
              {/* Media display - Video or Image */}
              {testimonial.video_url ? (
                // Video Story
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  {idx === currentIndex ? (
                    <video
                      ref={videoRef}
                      src={testimonial.video_url}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      playsInline
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        setVideoDuration(video.duration);
                      }}
                      onTimeUpdate={(e) => handleVideoTimeUpdate(e.currentTarget)}
                      onEnded={handleVideoEnd}
                      onPlay={() => setIsPaused(false)}
                      onPause={() => setIsPaused(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white/50 text-4xl">▶️</div>
                    </div>
                  )}
                </div>
              ) : (
                // Image Story
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  {testimonial.customer_photo ? (
                    <>
                      <img
                        src={testimonial.customer_photo}
                        alt={testimonial.customer_name}
                        className="max-w-full max-h-full object-contain md:object-contain"
                        style={{
                          maxHeight: '85vh',
                          width: 'auto',
                          height: 'auto'
                        }}
                      />
                      {/* Gradient overlays for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="text-center text-white">
                        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-primary/30 flex items-center justify-center text-6xl md:text-8xl font-bold mb-4 mx-auto">
                          {getInitials(testimonial.customer_name)}
                        </div>
                        <p className="text-xl md:text-2xl font-semibold">{testimonial.customer_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Review text overlay - Only show for image stories (not videos) */}
              {!testimonial.video_url && (
                <div className="absolute bottom-8 md:bottom-12 left-0 right-0 px-4 md:px-8 z-10 pointer-events-none">
                  <div className="max-w-4xl mx-auto bg-gradient-to-t from-black/80 to-black/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 shadow-2xl">
                    <p className="text-white text-base md:text-xl lg:text-2xl font-medium leading-relaxed text-center">
                      "{testimonial.review_text}"
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="h-7 w-7 md:h-9 md:w-9 rounded-full overflow-hidden border-2 border-white/30">
                        {testimonial.customer_photo ? (
                          <img
                            src={testimonial.customer_photo}
                            alt={testimonial.customer_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                            {getInitials(testimonial.customer_name)}
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-xs md:text-sm">
                          {testimonial.customer_name}
                        </p>
                        {testimonial.product_name && (
                          <p className="text-white/70 text-xs">
                            {testimonial.product_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Click areas for navigation - Full screen tap to advance */}
              <div className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" onClick={handlePrevious} />
              <div className="absolute inset-y-0 left-1/3 right-1/3 z-20 cursor-pointer" onClick={handleNext} />
              <div className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer" onClick={handleNext} />
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
        {currentIndex < expandedTestimonials.length - 1 && (
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
      <div className="absolute bottom-2 left-0 right-0 text-center text-white/60 text-xs pointer-events-none">
        <p className="md:hidden">Tap left to go back • Tap right/center to skip</p>
        <p className="hidden md:block">Click left to go back • Click right/center to skip • Space to pause • ESC to close</p>
      </div>
    </div>
  );
};

export default StoriesCarousel;
