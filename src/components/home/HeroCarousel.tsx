import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconArrowRight } from "@/components/icons/aris-icons";

export interface HeroSlide {
  id: string;
  image_url: string;
  headline: string | null;
  subheadline: string | null;
  caption: string | null;
  cta_label: string | null;
  cta_link: string | null;
}

const AUTOPLAY_MS = 6000;

const isExternal = (href: string) =>
  /^(https?:)?\/\//i.test(href) || href.startsWith("wa.me") || href.startsWith("mailto:") || href.startsWith("tel:");

const normalise = (href: string) =>
  href.startsWith("wa.me") ? `https://${href}` : href;

/**
 * Image-first promotional carousel. Every slide is admin-managed artwork with a
 * single CTA. Real (non-image) copy stays in the markup for SEO and screen
 * readers even when the visible messaging lives inside the artwork.
 */
const HeroCarousel = () => {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("hero_slides")
        .select("id,image_url,headline,subheadline,caption,cta_label,cta_link")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!cancelled) setSlides((data || []) as HeroSlide[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = slides?.length ?? 0;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (count ? (i + dir + count) % count : 0)),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  const active = slides?.[index];

  // Real text for crawlers and assistive tech, never a visible "wrong then
  // corrected" flash: it is derived only from loaded data or the brand line.
  const headingText =
    active?.headline?.trim() ||
    "ARIS stationery and course equipment for Kenyan university students";
  const subText = active?.subheadline?.trim() || active?.caption?.trim() || null;

  return (
    <section className="bg-background" aria-label="ARIS promotions">
      <div className="container px-4 pb-6 pt-4 sm:pb-8 sm:pt-6">
        <h1 className="sr-only">{headingText}</h1>

        <div
          className="group relative overflow-hidden rounded-2xl border border-border bg-muted shadow-[0_18px_40px_-24px_hsl(var(--foreground)/0.45)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:aspect-[64/23]">
            {slides === null ? (
              /* Neutral skeleton: no placeholder copy that could read as wrong */
              <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
            ) : count === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/40 px-6 text-center">
                <p className="font-display text-lg font-bold sm:text-2xl">{headingText}</p>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  Browse the catalogue
                  <IconArrowRight size={16} />
                </Link>
              </div>
            ) : (
              slides.map((s, i) => (
                <img
                  key={s.id}
                  src={s.image_url}
                  alt={s.caption || s.headline || "ARIS promotion"}
                  width={1600}
                  height={575}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-contain sm:object-cover transition-all duration-700 ease-out ${
                    i === index ? "scale-100 opacity-100" : "scale-[1.03] opacity-0"
                  }`}
                />
              ))
            )}

            {/* CTA layer, lifted above the artwork with real depth */}
            {active?.cta_label?.trim() && active?.cta_link?.trim() && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 sm:justify-start sm:p-6">
                {isExternal(active.cta_link) ? (
                  <a
                    href={normalise(active.cta_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl sm:px-6 sm:py-3 sm:text-base"
                  >
                    {active.cta_label}
                    <IconArrowRight size={17} />
                  </a>
                ) : (
                  <Link
                    to={active.cta_link.startsWith("/") ? active.cta_link : `/${active.cta_link}`}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl sm:px-6 sm:py-3 sm:text-base"
                  >
                    {active.cta_label}
                    <IconArrowRight size={17} />
                  </Link>
                )}
              </div>
            )}

            {/* Arrows */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous slide"
                  className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur transition-all hover:scale-105 hover:bg-background sm:flex"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next slide"
                  className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur transition-all hover:scale-105 hover:bg-background sm:flex"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dots */}
        {count > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {slides!.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? "w-7 bg-primary" : "w-2 bg-muted-foreground/35 hover:bg-muted-foreground/60"
                }`}
              />
            ))}
          </div>
        )}

        {subText && (
          <p className="mt-3 text-center text-sm text-muted-foreground sm:text-left">{subText}</p>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;
