import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StarRating from "./StarRating";
import { CustomerTestimonial } from "@/types/testimonial";
import { Play } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TestimonialCardProps {
  testimonial: CustomerTestimonial;
  onOpenStory?: () => void;
}

const TestimonialCard = ({ testimonial, onOpenStory }: TestimonialCardProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showFullReview, setShowFullReview] = useState(false);
  
  const truncatedReview = testimonial.review_text.length > 150 
    ? testimonial.review_text.substring(0, 150) + "..." 
    : testimonial.review_text;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={onOpenStory}>
        <div className="relative">
          <img 
            src={testimonial.customer_photo} 
            alt={testimonial.customer_name}
            className="w-full h-64 object-cover"
          />
          {testimonial.video_url && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVideo(true);
              }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <Play className="w-16 h-16 text-white" fill="white" />
            </button>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{testimonial.customer_name}</h3>
              {testimonial.product_name && (
                <Badge variant="secondary" className="mt-1">
                  {testimonial.product_name}
                </Badge>
              )}
            </div>
            <StarRating rating={testimonial.rating} />
          </div>
          <p className="text-muted-foreground">
            {showFullReview ? testimonial.review_text : truncatedReview}
          </p>
          {testimonial.review_text.length > 150 && (
            <button
              onClick={() => setShowFullReview(!showFullReview)}
              className="text-primary text-sm mt-2 hover:underline"
            >
              {showFullReview ? "Show less" : "Read more"}
            </button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-4xl">
          <video 
            src={testimonial.video_url} 
            controls 
            autoPlay
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TestimonialCard;
