import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, MapPin, Mail, Instagram, ArrowUpRight, HelpCircle, ChevronDown } from "lucide-react";
import icon from "@/assets/aris-icon.png.asset.json";
import { useCategoryTree } from "@/hooks/use-category-tree";

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

const MpesaMark = () => (
  <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5">
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="2.6" width="12" height="18.8" rx="2.2" />
      <path d="M10 8.6h4M10 11.4h4" />
      <path d="M11 8.6v4.4c0 1.4 1.1 2.3 2.5 2.3" />
    </svg>
    <span className="text-[11px] font-semibold tracking-wide text-white/80">M-PESA</span>
  </span>
);

const aboutLinks = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
  { to: "/returns", label: "Return Policy" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
];

const quickLinks = [
  { to: "/shop", label: "Browse everything" },
  { to: "/deals", label: "Deals" },
  { to: "/school-list", label: "Send your list" },
  { to: "/testimonials", label: "Customer reviews" },
  { to: "/cart", label: "Your cart" },
];

const FooterLink = ({ to, label }: { to: string; label: string }) => (
  <li>
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-primary"
    >
      <span className="relative truncate">
        {label}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
      </span>
      <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  </li>
);

const FooterSection = ({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-white/10 lg:border-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-3.5 text-left lg:pointer-events-none lg:mb-4 lg:py-0"
      >
        <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/90">{title}</h4>
        <ChevronDown
          className={`h-4 w-4 text-white/50 transition-transform lg:hidden ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div className={`${open ? "block pb-4" : "hidden"} lg:block lg:pb-0`}>{children}</div>
    </div>
  );
};

const Footer = () => {
  const { tree, loading } = useCategoryTree();

  return (
    <footer className="relative mt-auto overflow-hidden">
      <div className="relative bg-black">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="container relative z-10 px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-0 lg:grid-cols-12 lg:gap-8">
            {/* Brand */}
            <div className="pb-6 lg:col-span-4 lg:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 rounded-xl bg-white p-2 shadow-lg shadow-primary/10">
                  <img src={icon.url} alt="ARIS" className="h-10 w-auto" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-display text-2xl font-black tracking-tight text-primary">ARIS</span>
                  <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">
                    Spend less. Study better.
                  </span>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                Course equipment and stationery for Kenyan university students. Packed at our Nairobi
                counter, dispatched the same day.
              </p>

              <div className="mt-5 flex items-center gap-2">
                <a
                  href="https://wa.me/254119774470"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label="WhatsApp ARIS"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/20 hover:text-primary"
                >
                  <WhatsAppIcon />
                </a>
                <a
                  href="https://www.instagram.com/aris.kenya/"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label="ARIS on Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/20 hover:text-primary"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.tiktok.com/@aris.kenya"
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label="ARIS on TikTok"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/20 hover:text-primary"
                >
                  <TikTokIcon />
                </a>
              </div>
            </div>

            {/* About */}
            <FooterSection title="About" className="lg:col-span-2">
              <ul className="space-y-2.5">
                {aboutLinks.map((l) => (
                  <FooterLink key={l.to} {...l} />
                ))}
              </ul>
            </FooterSection>

            {/* Categories, straight from the taxonomy */}
            <FooterSection title="Shop by category" className="lg:col-span-3">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 lg:grid-cols-1">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <li key={i} className="h-4 animate-pulse rounded bg-white/5" />
                    ))
                  : tree.map((c) => (
                      <FooterLink key={c.slug} to={`/category/${c.slug}`} label={c.name} />
                    ))}
              </ul>
            </FooterSection>

            {/* Quick links + contact */}
            <FooterSection title="Quick links" className="lg:col-span-3">
              <ul className="space-y-2.5">
                {quickLinks.map((l) => (
                  <FooterLink key={l.to} {...l} />
                ))}
              </ul>
            </FooterSection>

          </div>

          {/* Support strip */}
          <div className="mt-7 grid gap-5 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Support</p>
              <a
                href="https://wa.me/254119774470?text=Hi%20ARIS%2C%20I%20need%20help"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-2 inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-primary"
              >
                <HelpCircle className="h-4 w-4" />
                WhatsApp +254 119 774470
                <ArrowUpRight className="h-3.5 w-3.5 -translate-x-0.5 transition-transform group-hover:translate-x-0 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="mailto:arisstationeries@gmail.com"
                className="mt-2 flex items-center gap-2 break-all text-sm text-white/60 transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                arisstationeries@gmail.com
              </a>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Pickup</p>
              <p className="mt-2 flex items-start gap-2 text-sm text-white/60">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Nairobi, Kenya. Current pickup points are listed at checkout.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">Payment</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <MpesaMark />
              </div>
              <p className="mt-2 text-xs text-white/40">M-Pesa only for now. No card payments yet.</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 border-t border-white/10 pt-5">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-white/45">
                © {new Date().getFullYear()} ARIS. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/45">
                <Link to="/privacy" className="transition-colors hover:text-primary">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="transition-colors hover:text-primary">
                  Terms
                </Link>
                <Link to="/returns" className="transition-colors hover:text-primary">
                  Return Policy
                </Link>
                <Link to="/auth" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                  <Shield className="h-3.5 w-3.5" /> Staff
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
