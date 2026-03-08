import { ShoppingCart, FileText, Users, Tag, Store } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import { useFooterVisibility } from "@/hooks/use-footer-visibility";

interface HeaderProps {
  cartItemCount: number;
}

const bottomTabs = [
  { to: "/", label: "Shop", icon: Store },
  { to: "/offers", label: "Offers", icon: Tag },
  { to: "/testimonials", label: "Customers", icon: Users },
  { to: "/brochure", label: "Brochure", icon: FileText },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
] as const;

const Header = ({ cartItemCount }: HeaderProps) => {
  const isFooterVisible = useFooterVisibility();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 transition-transform duration-200 hover:scale-105">
            <img src={logo} alt="ARIS STATIONERIES Logo" className="h-8 sm:h-10 md:h-12" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">ARIS STATIONERIES</span>
          </Link>
          
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <Link to="/offers">
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Offers</span>
              </Button>
            </Link>
            
            <Link to="/testimonials">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Happy Customers</span>
              </Button>
            </Link>
            
            <Link to="/brochure">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Brochure</span>
              </Button>
            </Link>
            
            <Link to="/cart">
              <Button variant="outline" size="icon" className="relative transition-all duration-200 hover:scale-110 active:scale-95">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartItemCount > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-[10px] sm:text-xs transition-transform duration-200"
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
      
      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
      >
        <div className="flex items-center justify-around h-16">
          {bottomTabs.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {to === "/cart" && cartItemCount > 0 && (
                    <Badge
                      className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center p-0 text-[9px] bg-primary"
                      variant="default"
                    >
                      {cartItemCount}
                    </Badge>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Header;
