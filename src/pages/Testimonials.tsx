import { useEffect, useState, useMemo } from "react";
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
import { Star, MessageSquarePlus } from "lucide-react";

const Testimonials = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { getCartItemCount } = useCart();
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStories, setShowStories] = useState(false);
  const [storiesStartIndex, setStoriesStartIndex] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const prefillData = useMemo(() => ({
    customerName: searchParams.get("name") || undefined,
    phone: searchParams.get("phone") || undefined,
    productName: searchParams.get("product") || undefined,
  }), [searchParams]);

  // Only auto-open the review dialog when explicitly requested via ?review=true
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
        .eq("show_in_stories", true);

      if (error) throw error;

      // Rank: highest rated first, then reviews with a photo, then admin display_order, then newest
      const rows = (data || []).slice().sort((a: any, b: any) => {
        const ra = a.rating || 0, rb = b.rating || 0;
        if (rb !== ra) return rb - ra;
        const pa = a.customer_photo ? 1 : 0, pb = b.customer_photo ? 1 : 0;
        if (pb !== pa) return pb - pa;
        const oa = a.display_order || 0, ob = b.display_order || 0;
        if (ob !== oa) return ob - oa;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setTestimonials(rows.map((t: any) => ({
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

  // Aggregate rating stats for schema + header display
  const stats = useMemo(() => {
    const rated = testimonials.filter(t => t.rating && t.rating > 0);
    const avg = rated.length ? rated.reduce((s, t) => s + (t.rating || 0), 0) / rated.length : 0;
    return { count: testimonials.length, ratedCount: rated.length, average: avg };
  }, [testimonials]);

  // JSON-LD: Organization aggregateRating + up to 10 individual reviews for Google
  const reviewJsonLd = useMemo(() => {
    if (stats.ratedCount < 3) return null;
    const reviews = testimonials
      .filter(t => t.rating && t.review_text)
      .slice(0, 10)
      .map(t => ({
        "@type": "Review",
        author: { "@type": "Person", name: t.customer_name },
        datePublished: t.created_at?.split("T")[0],
        reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
        reviewBody: t.review_text,
      }));
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ARIS Stationeries",
      url: "https://arisstationaries.co.ke",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: stats.average.toFixed(1),
        reviewCount: stats.ratedCount,
        bestRating: 5,
        worstRating: 1,
      },
      review: reviews,
    };
  }, [testimonials, stats]);

  if (location.pathname === "/happy-customers") {
    return <Navigate to="/testimonials" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-16 lg:pb-0">
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

  const SubmitDialog = (
    <Dialog
      open={isSubmitDialogOpen}
      onOpenChange={(open) => {
        setIsSubmitDialogOpen(open);
        if (open) document.body.classList.add('stories-open');
        else document.body.classList.remove('stories-open');
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 h-10 sm:h-11 text-sm sm:text-base px-4 sm:px-6">
          <MessageSquarePlus className="w-4 h-4" />
          Submit Your Review
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
  );

  return (
    <div className="min-h-screen pb-16 lg:pb-0">
      <SEO
        title="Reviews from real ARIS customers"
        description="Verified reviews from students at UoN, KU, Strathmore, JKUAT and USIU. Read before you order."
        canonicalUrl="/testimonials"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Reviews", url: "/testimonials" }]}
      />
      {reviewJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
        />
      )}
      <Header cartItemCount={getCartItemCount()} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-8 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-center">
            Customer Stories
          </h1>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Tap a story to watch what our customers say
          </p>

          {stats.ratedCount > 0 && (
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 text-sm">
              <div className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${n <= Math.round(stats.average) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <span className="font-semibold">{stats.average.toFixed(1)}</span>
              <span className="text-muted-foreground">
                · {stats.ratedCount} rating{stats.ratedCount === 1 ? "" : "s"}
              </span>
            </div>
          )}

          {testimonials.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              <StoryCircles testimonials={testimonials} onStoryClick={openStories} />
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center py-8 sm:py-10 px-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquarePlus className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-1">No stories yet</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to share your ARIS experience. Photos and video welcome.
              </p>
              {SubmitDialog}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {testimonials.length > 0 && (
        <section className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Share Your Experience</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Had a great experience with ARIS? We'd love to hear from you.
            </p>
            {SubmitDialog}
          </div>
        </section>
      )}

      <Footer />

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
