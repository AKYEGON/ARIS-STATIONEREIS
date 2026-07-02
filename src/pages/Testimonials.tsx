import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomerTestimonial } from "@/types/testimonial";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import StoriesCarousel from "@/components/testimonials/StoriesCarousel";
import StoryCircles from "@/components/testimonials/StoryCircles";
import ReviewSubmissionForm from "@/components/testimonials/ReviewSubmissionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

const Testimonials = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getCartItemCount } = useCart();
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStories, setShowStories] = useState(false);
  const [storiesStartIndex, setStoriesStartIndex] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Extract prefill data from URL params
  const prefillData = useMemo(() => ({
    customerName: searchParams.get("name") || undefined,
    phone: searchParams.get("phone") || undefined,
    productName: searchParams.get("product") || undefined,
  }), [searchParams]);

  // Auto-open dialog if review=true in URL params
  useEffect(() => {
    if (searchParams.get("review") === "true") {
      setIsSubmitDialogOpen(true);
    }
  }, [searchParams]);

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

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Auto-open stories if there are testimonials and user hasn't seen them yet
  // BUT skip if user came specifically to submit a review (review=true in URL)
  useEffect(() => {
    const isReviewMode = searchParams.get("review") === "true";
    if (testimonials.length > 0 && !showStories && !isReviewMode) {
      const hasSeenStories = sessionStorage.getItem('hasSeenStories');
      if (!hasSeenStories) {
        setShowStories(true);
        sessionStorage.setItem('hasSeenStories', 'true');
      }
    }
  }, [testimonials.length, showStories, searchParams]);
  
  // Redirect /happy-customers to /testimonials for SEO (avoid duplicate content)
  if (location.pathname === "/happy-customers") {
    return <Navigate to="/testimonials" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-16 md:pb-0">
        <SEO 
          title="What students actually say"
          description="Unfiltered notes from students who've ordered from ARIS."
          canonicalUrl="/testimonials"
        />
        <Header cartItemCount={getCartItemCount()} />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading testimonials...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <SEO
        title="Reviews from real ARIS customers"
        description="Verified reviews from students at UoN, KU, Strathmore, JKUAT and USIU. Read before you order."
        canonicalUrl="/testimonials"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Reviews", url: "/testimonials" }]}
      />
      <Header cartItemCount={getCartItemCount()} />
      
      {/* Hero Section with Story Circles */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-8 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-center">Customer Stories</h1>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Tap to watch what our customers say
          </p>
          
          {testimonials.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              <StoryCircles 
                testimonials={testimonials} 
                onStoryClick={openStories}
              />
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
              No stories available yet. Check back soon!
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Share Your Experience</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Had a great experience with ARIS? We'd love to hear from you!
          </p>
          
          <Dialog open={isSubmitDialogOpen} onOpenChange={(open) => {
              setIsSubmitDialogOpen(open);
              if (open) {
                document.body.classList.add('stories-open');
              } else {
                document.body.classList.remove('stories-open');
              }
            }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 h-10 sm:h-11 text-sm sm:text-base px-4 sm:px-6">
                📝 Submit Your Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Submit Your Review</DialogTitle>
              </DialogHeader>
              <ReviewSubmissionForm 
                onSuccess={() => {
                  setIsSubmitDialogOpen(false);
                  fetchTestimonials();
                }}
                prefillData={prefillData}
              />
            </DialogContent>
          </Dialog>
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
