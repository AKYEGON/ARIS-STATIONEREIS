import { Link } from "react-router-dom";
import { Shield, MapPin, Mail, MessageCircle, Instagram, Facebook, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import icon from "@/assets/aris-icon.png.asset.json";

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

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent -translate-y-full" />

      <div className="bg-black relative">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="container py-8 sm:py-12 px-4 sm:px-6 relative z-10">
          {/* Top: Brand + Columns */}
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

              {/* Socials */}
              <div className="flex items-center gap-2 mt-5">
                <a
                  href="https://wa.me/254119774470"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-primary transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-primary transition-all"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center text-white/70 hover:text-primary transition-all"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Explore */}
            <div className="sm:col-span-2">
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[0.15em] text-white/90">
                Explore
              </h4>
              <ul className="space-y-2.5">
                <li><Link to="/" className="text-sm text-white/60 hover:text-primary transition-colors">Home</Link></li>
                <li><Link to="/deals" className="text-sm text-white/60 hover:text-primary transition-colors">Deals</Link></li>
                <li><Link to="/students" className="text-sm text-white/60 hover:text-primary transition-colors">Shop by Course</Link></li>
                <li><Link to="/testimonials" className="text-sm text-white/60 hover:text-primary transition-colors">Reviews</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div className="col-span-2 sm:col-span-3">
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-[0.15em] text-white/90">
                Categories
              </h4>
              <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2.5">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to={`/category/${c.slug}`}
                      className="text-sm text-white/60 hover:text-primary transition-colors truncate block"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
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
                    <MessageCircle className="h-4 w-4 flex-shrink-0" />
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
