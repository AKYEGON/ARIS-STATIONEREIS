import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconArrowRight, IconDraftingCompass } from "@/components/icons/aris-icons";

export interface HeroSlide {
  id: string;
  image_url: string;
  headline: string | null;
  subheadline: string | null;
  caption: string | null;
  cta_label: string | null;
  cta_link: string | null;
}

const AUTOPLAY_MS = 6500;

/**
 * Hero imagery is admin-managed (hero_slides). Copy defaults live here only as
 * the zero-slide fallback so the page never renders an empty band.
 */
const HeroCarousel = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("id,image_url,headline,subheadline,caption,cta_label,cta_link")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!cancelled) {
        setSlides((data || []) as HeroSlide[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  const active = slides[index];

  const copy = useMemo(
    () => ({
      headline: active?.headline?.trim() || "Everything your course list asks for, in one place.",
      subheadline:
        active?.subheadline?.trim() ||
        "Drawing sets, scientific calculators, lab coats, notebooks. Priced for a student budget and delivered same-day inside Nairobi.",
      ctaLabel: active?.cta_label?.trim() || "Browse categories",
      ctaLink: active?.cta_link?.trim() || "#categories",
    }),
    [active],
  );

  return (
    <section className="relative overflow-hidden border-b border-border bg-secondary/40">
      <div className="container px-4 py-8 sm:py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          {/* Copy column - first in DOM so it paints before imagery (LCP text) */}
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              <IconDraftingCompass size={14} />
              Built for university students
            </p>

            <h1 className="mt-4 font-display text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">
              {copy.headline}
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.subheadline}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2">
                {copy.ctaLink.startsWith("#") ? (
                  <a href={copy.ctaLink}>
                    {copy.ctaLabel}
                    <IconArrowRight size={18} />
                  </a>
                ) : (
                  <Link to={copy.ctaLink}>
                    {copy.ctaLabel}
                    <IconArrowRight size={18} />
                  </Link>
                )}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/shop">Search the full catalogue</Link>
              </Button>
            </div>

            <p className="mt-5 text-xs text-muted-foreground">
              Order by 11am, get it the same day in Nairobi. Anywhere else in Kenya, 48 hours.
            </p>
          </div>

          {/* Imagery column */}
          <div className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted shadow-lg sm:aspect-[16/10]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : slides.length === 0 ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <IconDraftingCompass size={44} />
                  <p className="px-6 text-center text-xs">
                    Hero imagery is managed in Admin, Homepage tab.
                  </p>
                </div>
              ) : (
                slides.map((s, i) => (
                  <img
                    key={s.id}
                    src={s.image_url}
                    alt={s.caption || s.headline || "ARIS stationery"}
                    width={960}
                    height={600}
                    loading={i === 0 ? "eager" : "lazy"}
                    fetchPriority={i === 0 ? "high" : "auto"}
                    decoding="async"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      i === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))
              )}

              {active?.caption && (
                <p className="absolute bottom-0 left-0 right-0 bg-foreground/70 px-4 py-2 text-xs text-background">
                  {active.caption}
                </p>
              )}
            </div>

            {slides.length > 1 && (
              <div className="mt-3 flex justify-center gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setIndex(i)}
                    aria-label={`Show slide ${i + 1}`}
                    aria-current={i === index}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-primary" : "w-2.5 bg-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
