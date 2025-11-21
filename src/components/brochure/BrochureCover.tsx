import logo from "@/assets/logo.png";

const BrochureCover = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-8 print:page-break-after">
      {/* Background with green brand color */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15)_0%,transparent_50%)]"></div>
      
      <div className="relative text-center space-y-12 z-10">
        {/* Larger Logo */}
        <div className="mb-8">
          <img 
            src={logo} 
            alt="ARIS STATIONARIES Logo" 
            className="h-48 w-48 mx-auto print:h-40 print:w-40 drop-shadow-2xl"
          />
        </div>
        
        {/* Brand Name and Tagline */}
        <div className="space-y-6">
          <h1 className="text-7xl font-bold text-primary-foreground print:text-6xl drop-shadow-lg">
            ARIS STATIONARIES
          </h1>
          <div className="h-1 w-32 bg-primary-foreground/80 mx-auto rounded-full"></div>
          <p className="text-3xl text-primary-foreground/95 print:text-2xl font-light">
            Quality Stationery & Office Supplies
          </p>
        </div>

        {/* Catalog Info */}
        <div className="mt-20 space-y-3 text-primary-foreground/90">
          <p className="text-2xl font-semibold print:text-xl">Product Catalog</p>
          <p className="text-lg print:text-base">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Contact Information */}
        <div className="mt-28 pt-8 border-t border-primary-foreground/30 space-y-3 text-primary-foreground/95 print:text-sm">
          <p className="text-lg font-medium">📍 Nairobi, Kenya</p>
          <p className="text-lg font-medium">📞 0707222419</p>
          <p className="text-lg font-medium">✉️ scaler.com@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default BrochureCover;
