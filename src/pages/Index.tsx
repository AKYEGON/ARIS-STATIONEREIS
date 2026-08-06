import { useCart } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import HeroCarousel from "@/components/home/HeroCarousel";
import CategoryStrip from "@/components/home/CategoryStrip";
import DealsCarousel from "@/components/home/DealsCarousel";
import PopularStrip from "@/components/home/PopularStrip";
import DeliveryTrustStrip from "@/components/home/DeliveryTrustStrip";

const Index = () => {
  const { addToCart, getCartItemCount } = useCart();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ARIS Stationeries",
    url: "https://arisstationaries.co.ke",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://arisstationaries.co.ke/shop?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
      <SEO
        title="ARIS - stationery and course equipment for Kenyan university students"
        description="Drawing sets, scientific calculators, notebooks and lab kit for university students. Same-day delivery in Nairobi, 48 hours countrywide, M-Pesa or card, pickup at UoN."
        canonicalUrl="/"
        breadcrumbs={[{ name: "Home", url: "/" }]}
        structuredData={websiteSchema}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1">
        <HeroCarousel />
        <CategoryStrip />
        <DealsCarousel onAddToCart={addToCart} />
        <PopularStrip onAddToCart={addToCart} />
        <DeliveryTrustStrip />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
