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
          title="Customer Reviews & Stories"
          description="Read what our customers say about ARIS STATIONERIES. Real reviews from happy customers in Nairobi, Kenya."
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
        title="Customer Reviews | Aris Stationeries Kenya"
        description="Read verified reviews from Aris Stationeries customers across Kenya. See why students at UoN, KU, Strathmore and USIU trust us for affordable stationery."
        canonicalUrl="/testimonials"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Reviews", url: "/testimonials" }]}
      />
      <Header cartItemCount={getCartItemCount()} />
      
      {/* Hero Section with Story Circles */}
      <section className="py-8 sm:py-12 md:py-16" style={{ background: "#EFF6F0" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          {/* ── Section header ── */}
          <div className="mb-6 md:mb-8 flex items-center gap-3">
            {/* Accent pip */}
            <span
              className="hidden sm:block w-1 h-6 rounded-full"
              style={{ background: "linear-gradient(180deg,#5C7A5F,#A8C5AB)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5"
                style={{ color: "#7A9E7E" }}
              >
                Real Stories
              </p>
              <h1
                className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight"
                style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}
              >
                Happy Customers
              </h1>
            </div>
          </div>
          
          <p
            className="text-[13px] sm:text-[14px] mb-6 md:mb-8 max-w-2xl"
            style={{ color: "#7A8C80" }}
          >
            Tap to watch what our customers say about their experience with ARIS STATIONERIES
          </p>
          
          {testimonials.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              <StoryCircles 
                testimonials={testimonials} 
                onStoryClick={openStories}
              />
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-[13px] sm:text-[14px]" style={{ color: "#7A8C80" }}>
              No stories available yet. Check back soon!
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          {/* ── Section header ── */}
          <div className="mb-6 md:mb-8 flex items-center gap-3">
            {/* Accent pip */}
            <span
              className="hidden sm:block w-1 h-6 rounded-full"
              style={{ background: "linear-gradient(180deg,#5C7A5F,#A8C5AB)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5"
                style={{ color: "#7A9E7E" }}
              >
                Share Your Experience
              </p>
              <h2
                className="text-lg sm:text-2xl md:text-3xl font-semibold leading-tight"
                style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}
              >
                We'd Love to Hear From You
              </h2>
            </div>
          </div>
          
          <p
            className="text-[13px] sm:text-[14px] mb-6 md:mb-8 max-w-2xl"
            style={{ color: "#7A8C80" }}
          >
            Had a great experience with ARIS STATIONERIES? Share your story and help other customers discover why we're Kenya's favorite stationery store.
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
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-6 text-[12.5px] font-medium transition-colors"
                style={{ background: "#2C3E35", color: "#fff" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#5C7A5F";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#2C3E35";
                }}
              >
                📝 Submit Your Review
              </button>
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
