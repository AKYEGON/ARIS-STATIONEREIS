import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerTestimonial } from "@/types/testimonial";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedTestimonial from "@/components/testimonials/FeaturedTestimonial";
import TestimonialCard from "@/components/testimonials/TestimonialCard";
import StoriesCarousel from "@/components/testimonials/StoriesCarousel";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { Play } from "lucide-react";

const Testimonials = () => {
  const { getCartItemCount } = useCart();
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStories, setShowStories] = useState(false);
  const [storiesStartIndex, setStoriesStartIndex] = useState(0);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_testimonials")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestimonials((data || []).map(t => ({
        ...t,
        rating: t.rating as 1 | 2 | 3 | 4 | 5
      })));
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const featuredTestimonials = testimonials.filter(t => t.is_featured);
  const regularTestimonials = testimonials.filter(t => !t.is_featured);

  const openStories = (index: number = 0) => {
    setStoriesStartIndex(index);
    setShowStories(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header cartItemCount={getCartItemCount()} />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading testimonials...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header cartItemCount={getCartItemCount()} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Happy Customers</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            See why customers love shopping with ARIS STATIONARIES
          </p>
          {testimonials.length > 0 && (
            <Button 
              onClick={() => openStories(0)}
              size="lg"
              className="gap-2 animate-scale-in"
            >
              <Play className="h-5 w-5" />
              Watch Customer Stories
            </Button>
          )}
        </div>
      </section>

      {/* Featured Testimonials */}
      {featuredTestimonials.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Stories</h2>
          <div className="grid gap-8 max-w-5xl mx-auto">
            {featuredTestimonials.map((testimonial) => (
              <FeaturedTestimonial key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </section>
      )}

      {/* All Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Customer Reviews</h2>
        
        {regularTestimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularTestimonials.map((testimonial, idx) => (
              <TestimonialCard 
                key={testimonial.id} 
                testimonial={testimonial}
                onOpenStory={() => openStories(idx)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No testimonials available yet. Check back soon!
          </div>
        )}
      </section>

      <Footer />

      {/* Stories Carousel */}
      {showStories && (
        <StoriesCarousel
          testimonials={testimonials}
          initialIndex={storiesStartIndex}
          onClose={() => setShowStories(false)}
        />
      )}
    </div>
  );
};

export default Testimonials;
