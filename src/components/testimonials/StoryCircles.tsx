import { CustomerTestimonial } from "@/types/testimonial";
import { cn } from "@/lib/utils";

interface StoryCirclesProps {
  testimonials: CustomerTestimonial[];
  onStoryClick: (index: number) => void;
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const StoryCircles = ({ testimonials, onStoryClick }: StoryCirclesProps) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-4 hide-scrollbar">
      {testimonials.map((testimonial, index) => (
        <button
          key={testimonial.id}
          onClick={() => onStoryClick(index)}
          className="flex flex-col items-center gap-2 flex-shrink-0 group"
        >
          <div className={cn(
            "relative p-1 rounded-full bg-gradient-to-tr from-green-400 via-green-500 to-green-600",
            "hover:scale-110 transition-transform duration-200"
          )}>
            <div className="bg-background p-1 rounded-full">
              {testimonial.customer_photo ? (
                <img
                  src={testimonial.customer_photo}
                  alt={testimonial.customer_name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                  {getInitials(testimonial.customer_name)}
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-center max-w-[90px] truncate">
            {testimonial.customer_name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default StoryCircles;
