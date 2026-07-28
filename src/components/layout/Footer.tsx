import { Link } from "react-router-dom";
import { Shield, MapPin, Mail, Instagram, Facebook, Heart, ArrowUpRight, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import icon from "@/assets/aris-icon.png.asset.json";

// Inline brand marks (lucide has no official WhatsApp / TikTok glyphs)
const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.005a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zM20.52 3.449C18.24 1.245 15.24.024 12.045.024 5.463.024.104 5.381.101 11.965c0 2.096.547 4.142 1.588 5.945L0 24l6.24-1.638a11.9 11.9 0 005.7 1.452h.005c6.585 0 11.945-5.36 11.948-11.945a11.87 11.87 0 00-3.473-8.42z" />
  </svg>
);

const TikTokIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43V8.87a8.16 8.16 0 004.77 1.52V6.94a4.85 4.85 0 01-1.84-.25z" />
  </svg>
);

const Footer = () => {
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    supabase
      .from("product_categories")
      .select("name,slug,display_order")
      .eq("is_active", true)
      .order("display_order")
      .limit(6)
      .then(({ data }) => {
        if (data) setCategories(data as any);
      });
  }, []);

  const exploreLinks = [
    { to: "/", label: "Home" },
    { to: "/deals", label: "Deals" },
    { to: "/students", label: "Shop by Course" },
    { to: "/testimonials", label: "Reviews" },
    { to: "/cart", label: "Your Cart" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent -translate-y-full" />

      <div className="bg-black relative">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="container py-8 sm:py-12 px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-8 sm:gap-10">
            {/* Brand block */}
            <div className="col-span-2 sm:col-span-4">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-2 flex-shrink-0 shadow-lg shadow-primary/10">
                  <img src={icon.url} alt="ARIS" className="h-11 w-auto" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display font-black tracking-tight text-primary text-3xl">
                    ARIS
                  </span>
                  <span className="text-[10px] text-primary/80 tracking-[0.18em] uppercase font-medium mt-1.5">
                    Spend less. Study better.
                  </span>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mt-4 max-w-xs">
                Stationery picked to your course list. Packed in Nairobi, on the road the same day.
              </p>

              {/* Support callout */}
              <a
                href="https://wa.me/254119774470?text=Hi%20ARIS%2C%20I%20need%20help"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 px-3.5 py-2 text-xs text-primary transition-all group"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="font-medium">Need help? WhatsApp us</span>
                <ArrowUpRight className="h-3.5 w-3.5 -translate-x-0.5 group-hover:translate-x-0 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Socials */}
              <div className="flex items-center gap-2 mt-5">
                <a
                  href="https://wa.me/254119774470"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-primary transition-all hover:-translate-y-0.5"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/aris.kenya/"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label="ARIS on Instagram"
                  title="ARIS on Instagram"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-primary transition-all hover:-translate-y-0.5"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.tiktok.com/@aris.kenya"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label="ARIS on TikTok"
                  title="ARIS on TikTok"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-primary transition-all hover:-translate-y-0.5"
                >
                  <TikTokIcon className="h-4 w-4" />
                </a>

              </div>
            </div>

            {/* Explore */}
            <div className="sm:col-span-2">
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[0.15em] text-white/90">
                Explore
              </h4>
              <ul className="space-y-2.5">
                {exploreLinks.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-primary transition-colors"
                    >
                      <span className="relative">
                        {l.label}
                        <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-primary group-hover:w-full transition-all duration-300" />
                      </span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div className="col-span-2 sm:col-span-3">
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[0.15em] text-white/90">
                Categories
              </h4>
              <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2.5">
                {categories.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="h-4 rounded bg-white/5 animate-pulse" />
                  ))
                ) : (
                  categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        to={`/category/${c.slug}`}
                        className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-primary transition-colors truncate"
                      >
                        <span className="relative truncate">
                          {c.name}
                          <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-primary group-hover:w-full transition-all duration-300" />
                        </span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 sm:col-span-3">
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[0.15em] text-white/90">
                Get in Touch
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://wa.me/254119774470"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    <WhatsAppIcon className="h-4 w-4 flex-shrink-0" />
                    +254 119 774470
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:arisstationeries@gmail.com"
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-primary transition-colors break-all"
                  >
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    arisstationeries@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  Nairobi, Kenya
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs text-white/45">
                © {new Date().getFullYear()} ARIS. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-xs text-white/45">
                <Link to="/auth" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Link>
                <span className="flex items-center gap-1.5">
                  Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> in Kenya
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
