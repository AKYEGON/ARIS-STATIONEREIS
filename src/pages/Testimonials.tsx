import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerTestimonial } from "@/types/testimonial";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedTestimonial from "@/components/testimonials/FeaturedTestimonial";
import TestimonialCard from "@/components/testimonials/TestimonialCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

const Testimonials = () => {
  const { getCartItemCount } = useCart();
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filterByRating = (rating: number) => {
    return regularTestimonials.filter(t => t.rating === rating);
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
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why customers love shopping with ARIS STATIONARIES
          </p>
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

      {/* All Testimonials with Filters */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Customer Reviews</h2>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-6 mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="5">⭐ 5</TabsTrigger>
            <TabsTrigger value="4">⭐ 4</TabsTrigger>
            <TabsTrigger value="3">⭐ 3</TabsTrigger>
            <TabsTrigger value="2">⭐ 2</TabsTrigger>
            <TabsTrigger value="1">⭐ 1</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </TabsContent>

          {[5, 4, 3, 2, 1].map((rating) => (
            <TabsContent key={rating} value={rating.toString()}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByRating(rating).length > 0 ? (
                  filterByRating(rating).map((testimonial) => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No {rating}-star reviews yet
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {testimonials.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No testimonials available yet. Check back soon!
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Testimonials;
