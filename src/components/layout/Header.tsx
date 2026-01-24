import { ShoppingCart, FileText, Users, Menu, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { useFooterVisibility } from "@/hooks/use-footer-visibility";

interface HeaderProps {
  cartItemCount: number;
}

const Header = ({ cartItemCount }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isFooterVisible = useFooterVisibility();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 transition-transform duration-200 hover:scale-105">
            <img src={logo} alt="ARIS STATIONERIES Logo" className="h-8 sm:h-10 md:h-12" />
            <span className="hidden sm:inline-block text-lg sm:text-xl md:text-2xl font-bold text-primary">ARIS STATIONERIES</span>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <Link 
                    to="/" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Shop
                  </Link>
                  <Link 
                    to="/offers" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <Tag className="h-5 w-5" />
                    Offers
                  </Link>
                  <Link 
                    to="/testimonials" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <Users className="h-5 w-5" />
                    Happy Customers
                  </Link>
                  <Link 
                    to="/brochure" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <FileText className="h-5 w-5" />
                    Brochure
                  </Link>
                  <Link 
                    to="/cart" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Cart {cartItemCount > 0 && `(${cartItemCount})`}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link to="/offers" className="hidden md:block">
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Offers</span>
              </Button>
            </Link>
            
            <Link to="/testimonials" className="hidden md:block">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Happy Customers</span>
              </Button>
            </Link>
            
            <Link to="/brochure" className="hidden md:block">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Brochure</span>
              </Button>
            </Link>
            
            <Link to="/cart" className="hidden md:block">
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
      
      {/* Floating Cart Button for Mobile - Centered at bottom, hides when footer is visible */}
      <Link 
        to="/cart" 
        className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          cartItemCount > 0 
            ? 'bg-primary text-primary-foreground animate-bounce-subtle' 
            : 'bg-background border-2 border-primary text-primary'
        } ${
          isFooterVisible 
            ? 'opacity-0 pointer-events-none translate-y-4' 
            : 'opacity-100 translate-y-0'
        }`}
      >
        <ShoppingCart className="h-6 w-6" />
        {cartItemCount > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-secondary text-secondary-foreground text-xs font-bold"
            variant="default"
          >
            {cartItemCount}
          </Badge>
        )}
      </Link>
    </>
  );
};

export default Header;
