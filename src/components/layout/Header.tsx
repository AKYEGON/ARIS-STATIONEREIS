import { ShoppingCart, GraduationCap, Users, Tag, Store, Search, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useState } from "react";

interface HeaderProps {
  cartItemCount: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const bottomTabs = [
  { to: "/", label: "Shop", icon: Store },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/testimonials", label: "Customers", icon: Users },
  { to: "/students", label: "Courses", icon: GraduationCap },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
] as const;

const Header = ({ cartItemCount, searchQuery = "", onSearchChange }: HeaderProps) => {
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* ── Announcement Bar ─────────────────────── */}
      <div className="hidden md:flex items-center justify-center gap-8 bg-[#2C3E35] text-white/75 text-[11.5px] tracking-[0.05em] px-4 py-2.5">
        <span className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#A8C5AB]" />
          Free delivery over KES 1,500
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-[#A8C5AB]" />
          Back to school — 20% off all items
        </span>
        <span className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-[#A8C5AB]" />
          Nairobi-wide delivery available
        </span>
      </div>

      {/* ── Main Header ──────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-[#DDE8DF]" style={{ boxShadow: "0 1px 12px rgba(92,122,95,0.07)" }}>
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-6 px-4 md:px-8" style={{ height: "68px" }}>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="flex items-center justify-center flex-shrink-0">
    {!logoError ? (
      <img
        src={logo}
        alt="Aris Stationeries"
        // h-8 (32px) on mobile, h-10 (40px) on desktop. w-auto lets it expand naturally without squishing.
        className="h-8 md:h-10 w-auto object-contain object-left transition-all duration-300"
        onError={() => setLogoError(true)}
      />
    ) : (
      /* High-end editorial monogram token fallback if image path breaks */
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2C3E35] text-white shadow-sm border border-[#2C3E35]/10 hover:scale-105 transition-transform duration-300">
        <span className="font-serif font-bold text-lg leading-none tracking-wide">
          A
        </span>
      </div>
    )}
  </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: "/offers", label: "Offers", icon: Tag },
              { to: "/testimonials", label: "Customers", icon: Users },
              { to: "/students", label: "Shop by Course", icon: GraduationCap },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive(to)
                    ? "bg-[#EFF6F0] text-[#5C7A5F]"
                    : "text-[#4A5C50] hover:bg-[#EFF6F0] hover:text-[#5C7A5F]"
                }`}
              >
                <Icon className="h-[14px] w-[14px]" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side: search + cart */}
          <div className="flex items-center gap-3 flex-1 md:flex-none justify-end">
            {onSearchChange && (
              <div
                className="hidden md:flex items-center gap-2 rounded-lg px-3 py-[7px] min-w-[210px] lg:min-w-[250px] transition-all duration-200 focus-within:ring-1"
                style={{
                  background: "#EFF6F0",
                  border: "1px solid #DDE8DF",
                  // @ts-ignore
                  "--tw-ring-color": "#7A9E7E50",
                }}
              >
                <Search className="h-4 w-4 text-[#7A8C80] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent border-none outline-none text-[13px] text-[#2C3E35] placeholder-[#7A8C80] w-full"
                />
              </div>
            )}

            <Link to="/cart">
              <button
                className="flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors duration-200 hover:bg-[#5C7A5F] active:scale-95"
                style={{ background: "#2C3E35" }}
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {cartItemCount > 0 && (
                  <span
                    className="text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center"
                    style={{ background: "#7A9E7E" }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        {onSearchChange && (
          <div className="md:hidden border-t border-[#DDE8DF] px-4 py-2.5" style={{ background: "#FAFAF8" }}>
            <div
              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 transition-colors"
              style={{ border: "1px solid #DDE8DF" }}
            >
              <Search className="h-4 w-4 text-[#7A8C80] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search pens, notebooks, calculators…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="flex-1 text-[13px] text-[#2C3E35] placeholder-[#7A8C80] bg-transparent outline-none border-none"
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Tab Bar ─────────────────── */}
      <nav
        data-bottom-nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-[#DDE8DF]"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)",
          boxShadow: "0 -4px 20px rgba(92,122,95,0.08)",
        }}
      >
        <div className="flex items-center justify-around" style={{ height: 58 }}>
          {bottomTabs.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  active ? "text-[#5C7A5F]" : "text-[#7A8C80]"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {to === "/cart" && cartItemCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2.5 flex items-center justify-center rounded-full text-white"
                      style={{
                        minWidth: 15, height: 15, fontSize: 9,
                        fontWeight: 700, padding: "0 3px",
                        background: "#7A9E7E",
                      }}
                    >
                      {cartItemCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none tracking-wide">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;