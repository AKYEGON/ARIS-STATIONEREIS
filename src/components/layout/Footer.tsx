import { Link } from "react-router-dom";
import { Phone, MapPin, Clock, Truck, Shield, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="mt-auto">
      {/* ── Top accent line ── */}
      <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #5C7A5F 30%, #A8C5AB 60%, transparent)" }} />

      {/* ── Main footer body ── */}
      <div style={{ background: "#2C3E35" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">

            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="flex items-center justify-center rounded-[10px] flex-shrink-0"
                  style={{
                    width: 36, height: 36,
                    background: "linear-gradient(135deg, #5C7A5F 0%, #7A9E7E 100%)",
                  }}
                >
                  <img
                    src={logo}
                    alt="Aris"
                    className="h-5 w-5 object-contain"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = "none";
                      el.parentElement!.innerHTML = `<span style="color:#fff;font-weight:700;font-size:16px;font-family:Georgia,serif">A</span>`;
                    }}
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-[15px] leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                    Aris Stationeries
                  </p>
                </div>
              </div>

              <p className="text-[11px] tracking-[0.14em] uppercase mb-4" style={{ color: "#A8C5AB" }}>
                The home of affordable stationeries
              </p>

              <p className="text-[13px] leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)", maxWidth: 240 }}>
                Your trusted partner for all stationery needs. Delivering to UoN, KU, Strathmore, USIU and nationwide.
              </p>

              <a
                href="https://wa.me/254119774470"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13px] font-medium rounded-lg px-4 py-2.5 transition-colors duration-200"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.8)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "#5C7A5F";
                  (e.currentTarget as HTMLElement).style.borderColor = "#5C7A5F";
                  (e.currentTarget as HTMLElement).style.color = "#fff";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
                }}
              >
                <Phone className="h-4 w-4" style={{ color: "#A8C5AB" }} />
                Chat on WhatsApp
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-5" style={{ color: "#A8C5AB" }}>
                Quick Links
              </h4>
              <nav className="flex flex-col gap-2.5">
                {[
                  { to: "/", label: "Home" },
                  { to: "/offers", label: "Offers & Deals" },
                  { to: "/testimonials", label: "Happy Customers" },
                  { to: "/students", label: "Shop by Course" },
                  { to: "/auth", label: "Admin Portal" },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-[13px] transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-5" style={{ color: "#A8C5AB" }}>
                Categories
              </h4>
              <nav className="flex flex-col gap-2.5">
                {["Notebooks", "Pens & Pencils", "Calculators", "Drawing Sets", "Art Supplies", "Office Supplies"].map(cat => (
                  <Link
                    key={cat}
                    to="/"
                    className="text-[13px] transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                  >
                    {cat}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-5" style={{ color: "#A8C5AB" }}>
                Contact
              </h4>
              <div className="flex flex-col gap-3.5">
                {[
                  { icon: Phone, text: "+254 119 774 470" },
                  { icon: MapPin, text: "Nairobi, Kenya" },
                  { icon: Clock, text: "Mon–Sat, 8am–7pm" },
                  { icon: Truck, text: "Same-day delivery" },
                  { icon: Shield, text: "Admin Portal", to: "/auth" },
                ].map(({ icon: Icon, text, to }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Icon className="h-[15px] w-[15px] flex-shrink-0" style={{ color: "#A8C5AB" }} />
                    {to ? (
                      <Link
                        to={to}
                        className="text-[13px] transition-colors duration-150"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#A8C5AB")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                      >
                        {text}
                      </Link>
                    ) : (
                      <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>{text}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <p className="text-[11.5px] tracking-wide" style={{ color: "rgba(255,255,255,0.28)" }}>
              © {new Date().getFullYear()} Aris Stationeries. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "rgba(255,255,255,0.28)" }}>
              Made with <Heart className="h-3 w-3 fill-[#7A9E7E] text-[#7A9E7E]" /> in Kenya
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;