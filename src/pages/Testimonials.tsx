import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerTestimonial } from "@/types/testimonial";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoriesCarousel from "@/components/testimonials/StoriesCarousel";
import StoryCircles from "@/components/testimonials/StoryCircles";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

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

  const openStories = (index: number = 0) => {
    setStoriesStartIndex(index);
    setShowStories(true);
  };

  // Auto-open stories if there are testimonials and user hasn't seen them yet
  useEffect(() => {
    if (testimonials.length > 0 && !showStories) {
      const hasSeenStories = sessionStorage.getItem('hasSeenStories');
      if (!hasSeenStories) {
        setShowStories(true);
        sessionStorage.setItem('hasSeenStories', 'true');
      }
    }
  }, [testimonials.length]);

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
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <Header cartItemCount={getCartItemCount()} />
      
      {/* Hero Section with Animation */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 py-16 md:py-20">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 animate-scale-in">
              <span className="text-2xl">⭐</span>
              <span className="font-semibold">Real Stories from Real Customers</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Happy Customers
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              See why thousands love shopping with ARIS STATIONARIES
            </p>
            <p className="text-sm text-muted-foreground">
              Tap any story to watch • Auto-plays on mobile 📱
            </p>
          </div>

          {/* Social Proof Metrics */}
          {testimonials.length > 0 && (
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-12 animate-fade-in">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 text-center border border-primary/20 hover-scale">
                <div className="text-3xl font-bold text-primary mb-1">
                  {testimonials.reduce((sum, t) => sum + t.views, 0)}+
                </div>
                <div className="text-sm text-muted-foreground">Story Views</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 text-center border border-primary/20 hover-scale">
                <div className="text-3xl font-bold text-primary mb-1">
                  {testimonials.length}
                </div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 text-center border border-primary/20 hover-scale">
                <div className="text-3xl font-bold text-primary mb-1">5.0⭐</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>
          )}
          
          {testimonials.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">🎬 Customer Stories</h3>
                <p className="text-sm text-muted-foreground">Tap any circle to start watching</p>
              </div>
              <StoryCircles 
                testimonials={testimonials} 
                onStoryClick={openStories}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-background/50 rounded-2xl backdrop-blur-sm">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-lg font-semibold mb-2">No stories available yet</p>
              <p>Check back soon for amazing customer experiences!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section with Better Design */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-3xl p-8 md:p-12 text-center border border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-5xl mb-4 animate-scale-in">💬</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Share Your Experience</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Had a great experience with ARIS STATIONARIES? We'd love to feature your story and help others discover quality stationery!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 flex-1 max-w-xs hover-scale">
                <div className="text-3xl mb-2">⭐⭐⭐⭐⭐</div>
                <div className="font-semibold">5-Star Service</div>
                <div className="text-sm text-muted-foreground mt-1">Quality products & fast delivery</div>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 flex-1 max-w-xs hover-scale">
                <div className="text-3xl mb-2">🎁</div>
                <div className="font-semibold">Free Gifts</div>
                <div className="text-sm text-muted-foreground mt-1">Surprise gifts with every order</div>
              </div>
            </div>
          </div>
        </div>
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
