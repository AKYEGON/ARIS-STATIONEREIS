import { CustomerTestimonial } from "@/types/testimonial";
import { cn } from "@/lib/utils";

interface StoryCirclesProps {
  testimonials: CustomerTestimonial[];
  onStoryClick: (index: number) => void;
}

const StoryCircles = ({ testimonials, onStoryClick }: StoryCirclesProps) => {
  return (
    <div className="relative">
      {/* Gradient overlays for scroll indication */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div className="flex gap-6 overflow-x-auto pb-4 px-4 hide-scrollbar snap-x snap-mandatory">
        {testimonials.map((testimonial, index) => {
          const isNew = new Date(testimonial.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
          return (
            <button
              key={testimonial.id}
              onClick={() => onStoryClick(index)}
              className="flex flex-col items-center gap-3 flex-shrink-0 group snap-center animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                {/* Animated gradient ring */}
                <div className={cn(
                  "relative p-1 rounded-full",
                  "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500",
                  "hover:scale-110 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50",
                  "group-active:scale-95"
                )}>
                  {/* Inner glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400/20 via-pink-500/20 to-purple-500/20 blur-md group-hover:blur-lg transition-all" />
                  
                  <div className="relative bg-background p-1 rounded-full">
                    <img
                      src={testimonial.customer_photo}
                      alt={testimonial.customer_name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-2 ring-background"
                    />
                  </div>
                </div>
                
                {/* NEW badge */}
                {isNew && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-scale-in">
                    NEW
                  </div>
                )}
                
                {/* View count badge */}
                {testimonial.views > 0 && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm border border-primary/20 text-xs font-semibold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                    👁️ {testimonial.views}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <span className="text-sm font-medium max-w-[100px] block truncate group-hover:text-primary transition-colors">
                  {testimonial.customer_name}
                </span>
                {testimonial.product_name && (
                  <span className="text-xs text-muted-foreground max-w-[100px] block truncate">
                    {testimonial.product_name}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StoryCircles;
