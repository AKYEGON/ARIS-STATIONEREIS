import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface HeaderProps {
  cartItemCount: number;
}

const Header = ({ cartItemCount }: HeaderProps) => {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2 transition-transform duration-200 hover:scale-105">
            <img src="/logo.png" alt="ARIS STATIONARIES" className="h-8 sm:h-10" />
            <span className="hidden sm:inline-block text-lg sm:text-xl md:text-2xl font-bold text-primary">ARIS STATIONARIES</span>
          <span className="text-xs text-muted-foreground hidden md:inline">Free delivery to UoN hostels, Qejani & Qwetu. Other areas free for KSH 500+.</span>
        </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
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
            <span className="text-xs text-muted-foreground hidden md:inline">Free delivery to UoN hostels, Qejani & Qwetu. Other areas free for KSH 500+.</span>
        </Link>
          </div>
        </div>
      </header>
      
      {/* Floating Cart Button for Mobile - Always visible at bottom */}
      {cartItemCount > 0 && (
        <Link 
          to="/cart" 
          className="md:hidden fixed bottom-20 right-6 z-[100] bg-primary text-primary-foreground p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 animate-scale-in"
          style={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}
        >
          <ShoppingCart className="h-6 w-6" />
          <Badge 
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-secondary text-secondary-foreground text-xs font-bold"
            variant="default"
          >
            {cartItemCount}
          </Badge>
        <span className="text-xs text-muted-foreground hidden md:inline">Free delivery to UoN hostels, Qejani & Qwetu. Other areas free for KSH 500+.</span>
        </Link>
      )}
    </>
  );
};

export default Header;
