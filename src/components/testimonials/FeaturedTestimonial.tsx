import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerTestimonial } from "@/types/testimonial";
import { Play } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FeaturedTestimonialProps {
  testimonial: CustomerTestimonial;
}

const FeaturedTestimonial = ({ testimonial }: FeaturedTestimonialProps) => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <Card className="overflow-hidden border-primary/20 shadow-xl">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative h-full min-h-[400px]">
            <img 
              src={testimonial.customer_photo} 
              alt={testimonial.customer_name}
              className="w-full h-full object-cover"
            />
            {testimonial.video_url && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <Play className="w-20 h-20 text-white" fill="white" />
              </button>
            )}
          </div>
          <CardContent className="p-8 flex flex-col justify-center">
            <Badge className="w-fit mb-4">Featured Story</Badge>
            <h3 className="text-2xl font-bold mb-2">{testimonial.customer_name}</h3>
            {testimonial.product_name && (
              <p className="text-muted-foreground mb-4">
                Purchased: <span className="font-semibold">{testimonial.product_name}</span>
              </p>
            )}
            <p className="text-lg mt-6 leading-relaxed">
              "{testimonial.review_text}"
            </p>
          </CardContent>
        </div>
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

export default FeaturedTestimonial;
