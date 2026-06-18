import { ShoppingCart, GraduationCap, Users, Flame, Store, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

interface HeaderProps {
  cartItemCount: number;
}

const bottomTabs = [
  { to: "/", label: "Shop", icon: Store },
  { to: "/deals", label: "Deals", icon: Flame },
  { to: "/books", label: "Books", icon: BookOpen },
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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background md:bg-background/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 transition-transform duration-200 hover:scale-105">
            <img src={logo} alt="ARIS STATIONERIES Logo" className="h-8 sm:h-10 md:h-12" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">ARIS STATIONERIES</span>
          </Link>
          
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-2 sm:gap-4">
            <Link to="/deals">
              <Button variant="outline" size="sm">
                <Flame className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Deals</span>
              </Button>
            </Link>

            <Link to="/books">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Books</span>
              </Button>
            </Link>

            <Link to="/testimonials">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Happy Customers</span>
              </Button>
            </Link>
            
            <Link to="/students">
              <Button variant="outline" size="sm">
                <GraduationCap className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Shop by Course</span>
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
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
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
