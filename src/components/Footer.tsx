import { Link } from "react-router-dom";
import { Shield, Phone, MapPin, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Decorative top wave/curve */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background to-transparent -translate-y-full" />
      
      {/* Main footer with gradient background */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        {/* Green accent line at top */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        
        <div className="container py-10 sm:py-12 px-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {/* Brand Section */}
            <div className="flex flex-col items-start gap-4 sm:col-span-2 lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <img src={logo} alt="ARIS STATIONARIES Logo" className="h-14 sm:h-16" />
              </div>
              <div>
                <h3 className="font-bold text-lg sm:text-xl mb-2 text-primary">
                  ARIS STATIONARIES
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Quality you need, prices you will love. Your trusted partner for all stationery needs.
                </p>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4 text-base text-white flex items-center gap-2">
                <span className="w-8 h-0.5 bg-primary rounded-full" />
                Quick Links
              </h4>
              <div className="space-y-3">
                <Link 
                  to="/" 
                  className="text-sm text-white/70 hover:text-primary hover:translate-x-1 transition-all duration-200 block"
                >
                  Home
                </Link>
                <Link 
                  to="/offers" 
                  className="text-sm text-white/70 hover:text-primary hover:translate-x-1 transition-all duration-200 block"
                >
                  Special Offers
                </Link>
                <Link 
                  to="/testimonials" 
                  className="text-sm text-white/70 hover:text-primary hover:translate-x-1 transition-all duration-200 block"
                >
                  Happy Customers
                </Link>
                <Link 
                  to="/brochure" 
                  className="text-sm text-white/70 hover:text-primary hover:translate-x-1 transition-all duration-200 block"
                >
                  Brochure
                </Link>
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-base text-white flex items-center gap-2">
                <span className="w-8 h-0.5 bg-primary rounded-full" />
                Contact Us
              </h4>
              <div className="space-y-3">
                <a 
                  href="https://wa.me/254707222419" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-primary transition-all duration-200"
                >
                  <Phone className="h-4 w-4" />
                  +254 707 222419
                </a>
                <div className="flex items-start gap-2 text-sm text-white/70">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Nairobi, Kenya</span>
                </div>
              </div>
            </div>
            
            {/* Admin Section */}
            <div>
              <h4 className="font-semibold mb-4 text-base text-white flex items-center gap-2">
                <span className="w-8 h-0.5 bg-primary rounded-full" />
                Admin Access
              </h4>
              <Link 
                to="/auth" 
                className="inline-flex items-center gap-2 text-sm bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                Admin Login
              </Link>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
              <p>© {new Date().getFullYear()} ARIS STATIONARIES. All rights reserved.</p>
              <p className="flex items-center gap-1">
                Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> in Kenya
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;