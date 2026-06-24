import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { ChevronRight, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

const BASE_URL = "https://arisstationaries.co.ke";

const formatProduct = (p: any): Product & { slug?: string } => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  price: Number(p.price),
  originalPrice: p.original_price ? Number(p.original_price) : undefined,
  saleStartsAt: p.sale_starts_at || null,
  saleEndsAt: p.sale_ends_at || null,
  category: p.category,
  image: p.image,
  is_featured: p.is_featured,
  display_order: p.display_order,
  slug: p.slug,
  media: ((p as any).media || []).map((m: any) => ({
    ...m,
    media_type: m.media_type as "image" | "video",
  })),
  variants: ((p as any).variants || [])
    .filter((v: any) => v.is_active)
    .map((v: any) => ({
      ...v,
      price: Number(v.price),
      cost_price: Number(v.cost_price),
    })),
});

const CategoryLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, getCartItemCount } = useCart();
  const [category, setCategory] = useState<CategoryRow | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    try {
      const { data: cats } = await supabase
        .from("product_categories")
        .select("id,name,slug,icon,is_active,display_order")
        .eq("is_active", true)
        .order("display_order");
      setAllCategories((cats || []) as CategoryRow[]);

      const cat = (cats || []).find((c: any) => c.slug === slug);
      if (!cat) {
        setNotFound(true);
        return;
      }
      setCategory(cat as CategoryRow);

      // Fetch products: union of (a) products.category text == name, (b) M2M assignments
      const [{ data: byText }, { data: assignments }] = await Promise.all([
        supabase
          .from("products")
          .select(`*, media:product_media(*), variants:product_variants(*)`)
          .eq("category", cat.name),
        supabase
          .from("product_category_assignments")
          .select("product_id")
          .eq("category_id", cat.id),
      ]);

      const assignedIds = (assignments || []).map((a: any) => a.product_id);
      let byAssign: any[] = [];
      if (assignedIds.length > 0) {
        const { data } = await supabase
          .from("products")
          .select(`*, media:product_media(*), variants:product_variants(*)`)
          .in("id", assignedIds);
        byAssign = data || [];
      }

      const seen = new Set<string>();
      const merged: any[] = [];
      [...(byText || []), ...byAssign].forEach((p) => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          merged.push(p);
        }
      });

      merged.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
        return (a.display_order || 0) - (b.display_order || 0);
      });

      setProducts(merged.map(formatProduct));
    } catch (err) {
      console.error("Error loading category:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = (product: Product, variant?: any) => {
    addToCart(product, variant);
    toast.success(`${product.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted w-2/3 rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="min-h-screen flex flex-col pb-16">
        <SEO
          title="Category Not Found"
          description="The category you are looking for does not exist."
          canonicalUrl={`/category/${slug}`}
          noindex
        />
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Button onClick={() => navigate("/")}>Back to shop</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const COPY: Record<string, { title: string; desc: string; intro: string }> = {
    "notebooks-books": {
      title: "Notebooks & Exercise Books in Kenya",
      desc: "A5, A6 and A4 notebooks, exercise books and journals from KSh 30. Same-day pickup in Nairobi, delivery countrywide.",
      intro: "Notebooks from KSh 30. Exercise books, A5 hardcovers, leather journals, gazzel notebooks and spiral pads — all in stock and ready today. Order on WhatsApp +254 119 774470 for instant pricing or pick up at our Nairobi shop.",
    },
    "scientific-calculators": {
      title: "Scientific Calculators in Kenya",
      desc: "Casio fx-991EX, fx-82MS and more. Genuine units, best prices in Nairobi, delivered the same day.",
      intro: "Genuine Casio scientific calculators — fx-991EX (552 functions), fx-82MS and the full school range. Lowest verified prices in Nairobi, sealed boxes, one-year guarantee. WhatsApp +254 119 774470 and we'll deliver today.",
    },
    "engineering-drawing": {
      title: "Engineering & Drawing Sets in Kenya",
      desc: "T-squares, set squares, French curves, scale rulers and drawing boards for UoN, JKUAT, Kenyatta and Strathmore students.",
      intro: "Everything an engineering or architecture student needs — T-squares, set squares, French curves, scale rulers, drawing boards. Stocked for first-year kits at UoN, JKUAT, Kenyatta, Strathmore and USIU. WhatsApp +254 119 774470 for a full kit price.",
    },
    "mathematics-equipments": {
      title: "Mathematics Sets & Equipment in Kenya",
      desc: "Geometry sets, compasses, protractors and rulers for school and exam use. Affordable, in stock, delivered fast.",
      intro: "Geometry sets, compasses, protractors, rulers and dividers — exam-ready and priced for parents and students. Same-day pickup in Nairobi, countrywide delivery. WhatsApp +254 119 774470 to order.",
    },
    "writing-instruments": {
      title: "Pens & Writing Instruments in Kenya",
      desc: "BIC, M&G, Staedtler pens and pencils. Singles, boxes and bulk orders at wholesale rates.",
      intro: "Pens, pencils, markers and refills from BIC, M&G and Staedtler — singles or full boxes. Wholesale rates for offices, schools and resellers. WhatsApp +254 119 774470 for a quote.",
    },
    "filing-organization": {
      title: "Files, Folders & Office Organization in Kenya",
      desc: "Box files, lever arch files, document wallets and dividers. Bulk pricing for offices and law firms.",
      intro: "Box files, lever arch files, document wallets, ring binders and dividers — everything to keep an office in order. Bulk pricing for firms, schools and clinics. WhatsApp +254 119 774470 for a quote.",
    },
    "art-craft-supplies": {
      title: "Art & Craft Supplies in Kenya",
      desc: "Sketchbooks, brushes, paints, charcoal and craft kits for artists and design students.",
      intro: "Sketchbooks, brushes, watercolours, charcoal and craft kits — picked for art and design students across Nairobi. Restocked weekly. WhatsApp +254 119 774470 if you need a specific item.",
    },
    "office-supplies": {
      title: "Office Supplies in Kenya",
      desc: "Staplers, punches, tape, sticky notes, paper and everything an office runs on. Bulk orders welcome.",
      intro: "Staplers, punches, tape dispensers, sticky notes, printer paper — the everyday office essentials, in stock and priced for bulk orders. WhatsApp +254 119 774470 for an office quote.",
    },
    "exam-essentials": {
      title: "Exam Essentials in Kenya",
      desc: "KCSE and university exam packs — pens, pencils, foolscaps, calculators and geometry sets in one go.",
      intro: "Exam-day essentials in one drop — pens, pencils, foolscaps, calculators, geometry sets and pad covers. Save by buying the bundle. WhatsApp +254 119 774470 to reserve before your exam date.",
    },
    "gifts-accessories": {
      title: "Stationery Gifts & Accessories in Kenya",
      desc: "Executive gift sets, branded notebooks, pen sets and corporate gifts for staff and clients.",
      intro: "Executive gift sets, leather notebooks, branded pen sets and corporate giveaways — ideal for staff appreciation, conferences and clients. Branding available. WhatsApp +254 119 774470 to discuss your gift.",
    },
    "general-stationery": {
      title: "General Stationery in Kenya",
      desc: "Everyday stationery for homes, schools and offices. One stop, fair prices, fast delivery.",
      intro: "Everyday stationery for home, school and office in one place. Fair prices, same-day Nairobi pickup, countrywide delivery. WhatsApp +254 119 774470 to order.",
    },
  };

  const fallback = {
    title: `${category.name} in Kenya — Buy Online | Aris Stationeries`,
    desc: `Shop ${category.name.toLowerCase()} at Aris Stationeries Nairobi — fair prices, in stock, same-day pickup, countrywide delivery.`,
    intro: `Shop ${category.name.toLowerCase()} at Aris Stationeries — in stock and ready to ship. Same-day pickup in Nairobi, delivery countrywide. WhatsApp +254 119 774470 to order or ask for a bulk quote.`,
  };

  const copy = COPY[category.slug] || fallback;
  const title = copy.title.includes("ARIS") || copy.title.includes("Aris")
    ? copy.title
    : `${copy.title} — Buy Online | Aris Stationeries`;
  const description = copy.desc;
  const intro = copy.intro;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${category.name} | Aris Stationeries`,
      description,
      url: `${BASE_URL}/category/${category.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.slice(0, 30).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/product/${(p as any).slug || p.id}`,
        name: p.name,
      })),
    },
  ];

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: category.name, url: `/category/${category.slug}` },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <SEO
        title={title}
        description={description}
        canonicalUrl={`/category/${category.slug}`}
        structuredData={structuredData}
        breadcrumbs={breadcrumbs}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-6">
        <nav className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>

        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {category.name}
          </h1>
        </header>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No products in this category yet.</p>
            <Button onClick={() => navigate("/")}>Browse all products</Button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-3">
              {products.length} {products.length === 1 ? "product" : "products"} available
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={handleAdd} />
              ))}
            </div>
          </>
        )}

        {allCategories.length > 1 && (
          <section className="mt-10 pt-6 border-t">
            <h2 className="text-lg font-semibold mb-3">Browse other categories</h2>
            <div className="flex flex-wrap gap-2">
              {allCategories
                .filter((c) => c.slug !== category.slug)
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-secondary border border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryLanding;
