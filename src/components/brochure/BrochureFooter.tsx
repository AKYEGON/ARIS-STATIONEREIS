import { Phone, Mail, MapPin } from "lucide-react";

const BrochureFooter = () => {
  return (
    <footer className="bg-primary/5 border-t-4 border-primary py-8 mt-12 print:py-6 print:mt-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:gap-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Visit Us</h3>
              <p className="text-sm text-muted-foreground">
                ARIS STATIONARIES<br />
                Nairobi, Kenya
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Call Us</h3>
              <p className="text-sm text-muted-foreground">
                +254 XXX XXX XXX<br />
                Mon-Sat: 8AM - 6PM
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
              <p className="text-sm text-muted-foreground">
                info@arisstationaries.com<br />
                We reply within 24 hours
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center print:mt-6 print:pt-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ARIS STATIONARIES. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Prices are subject to change. Free delivery on orders above Ksh 3,000 within Nairobi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BrochureFooter;
