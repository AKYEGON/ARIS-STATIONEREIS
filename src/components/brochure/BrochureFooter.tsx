import { Phone, Mail, MapPin } from "lucide-react";

const BrochureFooter = () => {
  return (
    <footer className="bg-primary/5 border-t-2 border-primary py-4 mt-6 print:py-3 print:mt-4 print:border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:gap-2 print:text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 print:h-3 print:w-3" />
            <div>
              <h3 className="font-semibold text-foreground text-sm print:text-xs">Visit Us</h3>
              <p className="text-xs text-muted-foreground print:text-[10px]">
                ARIS STATIONERIES<br />
                Nairobi, Kenya
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 print:h-3 print:w-3" />
            <div>
              <h3 className="font-semibold text-foreground text-sm print:text-xs">Call Us</h3>
              <p className="text-xs text-muted-foreground print:text-[10px]">
                +254 XXX XXX XXX<br />
                Mon-Sat: 8AM - 6PM
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 print:h-3 print:w-3" />
            <div>
              <h3 className="font-semibold text-foreground text-sm print:text-xs">Email Us</h3>
              <p className="text-xs text-muted-foreground print:text-[10px]">
                info@arisstationaries.com<br />
                We reply within 24 hours
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border text-center print:mt-3 print:pt-2">
          <p className="text-xs text-muted-foreground print:text-[10px]">
            © {new Date().getFullYear()} ARIS STATIONERIES. All rights reserved.
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5 print:text-[9px]">
            Prices are subject to change. Free delivery on orders above Ksh 3,000 within Nairobi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BrochureFooter;
