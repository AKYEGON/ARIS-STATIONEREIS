import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Images, Star } from "lucide-react";
import { Product, ProductVariant } from "@/types/product";
import ProductMediaViewer from "./ProductMediaViewer";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, selectedVariant?: ProductVariant) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);

  const hasMultipleMedia = product.media && product.media.length > 0;
  const totalMediaCount = 1 + (product.media?.length || 0);
  const hasVariants = product.variants && product.variants.length > 0;
  const hasDiscount = !selectedVariant && product.originalPrice && product.originalPrice > product.price;

  const variantGroups = hasVariants
    ? product.variants!.reduce<Record<string, ProductVariant[]>>((acc, v) => {
        if (!acc[v.variant_type]) acc[v.variant_type] = [];
        acc[v.variant_type].push(v);
        return acc;
      }, {})
    : {};

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const productUrl = `https://arisstationaries.co.ke/products/${product.id}`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image.startsWith("http")
      ? product.image
      : `https://arisstationaries.co.ke${product.image}`,
    brand: { "@type": "Brand", name: "ARIS STATIONERIES" },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "KES",
      price: displayPrice,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "ARIS STATIONERIES" },
    },
    ...(hasDiscount
      ? { priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* ── Card shell ── */}
      <div
        className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
        style={{
          background: "#FFFFFF",
          border: "1px solid #DDE8DF",
          boxShadow: "0 1px 4px rgba(92,122,95,0.06)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(92,122,95,0.14)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(92,122,95,0.06)";
        }}
      >
        {/* ── Image area ── */}
        <Link
          to={`/product/${(product as any).slug || product.id}`}
          className="relative overflow-hidden flex items-center justify-center"
          style={{ background: "#EFF6F0", aspectRatio: "1 / 1" }}
          aria-label={`View ${product.name} details`}
        >
          {/* Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse" style={{ background: "#E2EDE3" }} />
          )}

          <img
            src={product.image}
            alt={`${product.name} — ${product.description} — Buy at ARIS STATIONERIES Nairobi Kenya`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`max-h-full max-w-full object-contain p-3 transition-all duration-500 group-hover:scale-[1.07] ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Badges top-left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_featured && (
              <span
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: "#F5E6D3", color: "#C8955C" }}
              >
                <Star className="h-2.5 w-2.5 fill-[#C8955C]" />
                Featured
              </span>
            )}
            {hasDiscount && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: "#D6E8D8", color: "#5C7A5F" }}
              >
                −{discountPct}%
              </span>
            )}
          </div>

          {/* Gallery count badge top-right */}
          {hasMultipleMedia && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setViewerOpen(true);
              }}
              className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full backdrop-blur-sm transition-colors"
              style={{ background: "rgba(44,62,53,0.72)", color: "#fff" }}
              aria-label="View gallery"
            >
              <Images className="h-3 w-3" />
              {totalMediaCount}
            </button>
          )}

          {/* Hover overlay — Add to Cart */}
          <div
            className="absolute inset-x-0 bottom-0 flex translate-y-full group-hover:translate-y-0 transition-transform duration-250"
          >
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 text-[12.5px] font-medium transition-colors"
              style={{ background: "#2C3E35", color: "#fff" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#5C7A5F")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#2C3E35")}
              onClick={(e) => {
                e.preventDefault();
                if (hasVariants && !selectedVariant) {
                  toast.error("Please select an option first");
                  return;
                }
                onAddToCart(product, selectedVariant);
              }}
            >
              <ShoppingCart className="h-4 w-4" />
              {hasVariants && !selectedVariant ? "Select Option" : "Add to Cart"}
            </button>
          </div>
        </Link>

        {/* ── Body ── */}
        <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
          {/* Category label */}
          <p
            className="text-[10px] font-semibold tracking-[0.08em] uppercase"
            style={{ color: "#7A9E7E" }}
          >
            {product.category}
          </p>

          {/* Name */}
          <Link
            to={`/product/${(product as any).slug || product.id}`}
            className="block transition-colors"
            style={{ color: "#2C3E35" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#5C7A5F")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#2C3E35")}
          >
            <h3
              className="text-[13px] sm:text-[14px] font-semibold leading-snug line-clamp-2"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {product.name}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-[11px] sm:text-[12px] line-clamp-1" style={{ color: "#7A8C80" }}>
            {product.description}
          </p>

          {/* Variants */}
          {hasVariants &&
            Object.entries(variantGroups).map(([type, variants]) => (
              <div key={type}>
                <p
                  className="text-[10px] font-medium mb-1 uppercase tracking-wide"
                  style={{ color: "#7A8C80" }}
                >
                  {type}
                </p>
                <div className="flex flex-wrap gap-1">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() =>
                        setSelectedVariant(selectedVariant?.id === v.id ? undefined : v)
                      }
                      className="text-[10px] px-2 py-0.5 rounded-md border transition-all"
                      style={
                        selectedVariant?.id === v.id
                          ? {
                              borderColor: "#5C7A5F",
                              background: "#EFF6F0",
                              color: "#5C7A5F",
                              fontWeight: 600,
                            }
                          : { borderColor: "#DDE8DF", color: "#7A8C80" }
                      }
                    >
                      {v.variant_value}{" "}
                      <span style={{ opacity: 0.7 }}>KSh {v.price.toFixed(0)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

          {/* Price row */}
          <div className="flex items-baseline gap-2 mt-auto pt-1">
            <span
              className="text-[15px] sm:text-[17px] font-bold"
              style={{ color: "#2C3E35" }}
            >
              KSh {displayPrice.toFixed(0)}
            </span>
            {hasDiscount && (
              <span
                className="text-[12px] line-through"
                style={{ color: "#A8B8AA" }}
              >
                KSh {product.originalPrice!.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        {/* ── Footer CTA (always visible on mobile, hidden on hover-capable screens via group) ── */}
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 md:hidden">
          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-medium transition-colors active:scale-95"
            style={{ background: "#2C3E35", color: "#fff" }}
            onClick={() => {
              if (hasVariants && !selectedVariant) {
                toast.error("Please select an option first");
                return;
              }
              onAddToCart(product, selectedVariant);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            {hasVariants && !selectedVariant ? "Select Option" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Media viewer */}
      <ProductMediaViewer
        product={product}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
};

export default ProductCard;