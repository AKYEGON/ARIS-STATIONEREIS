import { ShoppingCart, GraduationCap, Users, Flame, Store } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryMegaMenu, CategoryMobileMenu } from "@/components/layout/CategoryMegaMenu";
import icon from "@/assets/aris-icon.png";

interface HeaderProps {
  cartItemCount: number;
}

const bottomTabs = [
  { to: "/", label: "Shop", icon: Store },
  { to: "/deals", label: "Deals", icon: Flame },
  { to: "/testimonials", label: "Customers", icon: Users },
  { to: "/students", label: "Courses", icon: GraduationCap },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
] as const;

const Header = ({ cartItemCount }: HeaderProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-16 sm:h-20 items-center justify-between gap-3 px-4">
          {/* Brand: icon + stacked ARIS wordmark with tagline */}
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 transition-transform duration-200 hover:scale-[1.02] min-w-0"
            aria-label="ARIS - Spend less. Study better."
          >
            <img
              src={icon}
              alt=""
              aria-hidden="true"
              className="h-10 sm:h-12 md:h-14 w-auto flex-shrink-0"
            />
            <span className="flex flex-col leading-none min-w-0">
              <span className="font-display font-black tracking-tight text-primary text-2xl sm:text-3xl md:text-4xl">
                ARIS
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground tracking-[0.14em] uppercase font-medium mt-0.5">
                Spend less. Study better.
              </span>
            </span>
          </Link>

          {/* Mobile categories entry */}
          <CategoryMobileMenu />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <CategoryMegaMenu />
            <Link to="/deals">
              <Button variant="ghost" size="sm" className="font-medium">
                <Flame className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Deals</span>
              </Button>
            </Link>

            <Link to="/testimonials">
              <Button variant="ghost" size="sm" className="font-medium">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Customers</span>
              </Button>
            </Link>

            <Link to="/students">
              <Button variant="ghost" size="sm" className="font-medium">
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Shop by Course</span>
              </Button>
            </Link>

            <Link to="/cart">
              <Button
                variant="default"
                size="icon"
                className="relative transition-all duration-200 hover:scale-110 active:scale-95 ml-1"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-foreground text-background text-[10px]"
                    variant="default"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        data-bottom-nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
      >
        <div className="flex items-center justify-around" style={{ height: "clamp(52px, 8vh, 64px)" }}>
          {bottomTabs.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="h-[clamp(18px,2.5vh,22px)] w-[clamp(18px,2.5vh,22px)]" />
                  {to === "/cart" && cartItemCount > 0 && (
                    <Badge
                      className="absolute -top-1.5 -right-2.5 h-4 min-w-4 flex items-center justify-center p-0 text-[9px] bg-primary"
                      variant="default"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </span>
                <span className="text-[clamp(9px,1.2vh,11px)] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;
