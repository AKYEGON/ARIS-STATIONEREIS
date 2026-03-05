import { Link } from "react-router-dom";
import { Shield, Phone, MapPin, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Decorative top wave/curve */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent -translate-y-full" />
      
      {/* Main footer with black background */}
      <div className="bg-black relative">
        
        {/* Green accent line at top */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="container py-4 sm:py-6 px-4 relative z-10">
          {/* Mobile: Compact 2-column layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {/* Brand Section - Full width on mobile */}
            <div className="col-span-2 sm:col-span-1 flex items-center gap-3 sm:flex-col sm:items-start sm:gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 flex-shrink-0">
                <img src={logo} alt="ARIS STATIONERIES Logo" className="h-10 sm:h-16" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-xl text-primary">
                  ARIS STATIONERIES
                </h3>
                <p className="text-xs sm:text-sm text-white/70 leading-snug hidden sm:block">
                  THE HOME OF AFFORDABLE STATIONERIES. Your trusted partner for all stationery needs.
                </p>
                <p className="text-xs text-white/70 sm:hidden">THE HOME OF AFFORDABLE STATIONERIES</p>
              </div>
            </div>
            
            {/* Quick Links - Compact on mobile */}
            <div>
              <h4 className="font-semibold mb-2 sm:mb-4 text-xs sm:text-base text-white flex items-center gap-2">
                <span className="w-4 sm:w-8 h-0.5 bg-primary rounded-full" />
                Links
              </h4>
              <div className="space-y-1.5 sm:space-y-3">
                <Link to="/" className="text-xs sm:text-sm text-white/70 hover:text-primary transition-all block">
                  Home
                </Link>
                <Link to="/offers" className="text-xs sm:text-sm text-white/70 hover:text-primary transition-all block">
                  Offers
                </Link>
                <Link to="/testimonials" className="text-xs sm:text-sm text-white/70 hover:text-primary transition-all block">
                  Reviews
                </Link>
              </div>
            </div>
            
            {/* Contact + Admin combined on mobile */}
            <div>
              <h4 className="font-semibold mb-2 sm:mb-4 text-xs sm:text-base text-white flex items-center gap-2">
                <span className="w-4 sm:w-8 h-0.5 bg-primary rounded-full" />
                Contact
              </h4>
              <div className="space-y-1.5 sm:space-y-3">
                <a 
                  href="https://wa.me/254707222419" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-white/70 hover:text-primary transition-all"
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">+254 707 222419</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-white/70">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Nairobi</span>
                </div>
                <Link 
                  to="/auth" 
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-primary hover:text-primary/80 transition-all"
                >
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  Admin
                </Link>
              </div>
            </div>
            
          </div>
          
          {/* Bottom bar - More compact on mobile */}
          <div className="mt-3 sm:mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs sm:text-sm text-white/50">
              <p>© {new Date().getFullYear()} ARIS STATIONERIES</p>
              <p className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-400 fill-red-400" /> Kenya
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
