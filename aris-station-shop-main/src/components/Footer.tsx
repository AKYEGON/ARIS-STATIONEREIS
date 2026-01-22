import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-black mt-auto transition-all duration-300">
      <div className="container py-6 sm:py-8 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="flex flex-col items-start gap-3">
            <img src={logo} alt="ARIS STATIONERIES Logo" className="h-12 sm:h-14" />
            <div>
              <h3 className="font-bold text-base sm:text-lg mb-1 text-primary">
                ARIS STATIONERIES
              </h3>
              <p className="text-xs sm:text-sm text-white/70">
                Home of Affordable Stationeries
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-white">Contact</h4>
            <p className="text-xs sm:text-sm text-white/70">
              WhatsApp: +254 707 222419
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-white">Admin</h4>
            <Link 
              to="/auth" 
              className="text-xs sm:text-sm text-primary hover:underline transition-all duration-200 flex items-center gap-1"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              Admin Login
            </Link>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/20 text-center text-xs sm:text-sm text-white/60">
          © {new Date().getFullYear()} ARIS STATIONERIES. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
