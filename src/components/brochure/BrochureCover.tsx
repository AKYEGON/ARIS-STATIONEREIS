import logo from "@/assets/logo.png";
import stationeryBg from "@/assets/stationery-background.png";

const BrochureCover = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-8 print:page-break-after">
      {/* Stationery Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${stationeryBg})` }}
      ></div>
      
      {/* Faded Green Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/30 to-primary/25"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
      
      <div className="relative text-center space-y-8 sm:space-y-12 z-10">
        {/* Larger Logo */}
        <div className="mb-4 sm:mb-8">
          <img 
            src={logo} 
            alt="ARIS STATIONARIES Logo" 
            className="h-32 w-32 sm:h-48 sm:w-48 mx-auto print:h-40 print:w-40 drop-shadow-2xl"
          />
        </div>
        
        {/* Brand Name and Tagline */}
        <div className="space-y-4 sm:space-y-6">
          <h1 className="text-4xl sm:text-7xl font-bold text-primary-foreground print:text-6xl drop-shadow-lg px-4">
            ARIS STATIONARIES
          </h1>
          <div className="h-1 w-24 sm:w-32 bg-primary-foreground/80 mx-auto rounded-full"></div>
          <p className="text-xl sm:text-3xl text-primary-foreground/95 print:text-2xl font-light px-4">
            Home of Affordable Stationaries
          </p>
        </div>

        {/* Catalog Info */}
        <div className="mt-12 sm:mt-20 space-y-2 sm:space-y-3 text-primary-foreground/90">
          <p className="text-xl sm:text-2xl font-semibold print:text-xl">Product Catalog</p>
          <p className="text-base sm:text-lg print:text-base">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Contact Information */}
        <div className="mt-16 sm:mt-28 pt-6 sm:pt-8 border-t border-primary-foreground/30 space-y-2 sm:space-y-3 text-primary-foreground/95 print:text-sm px-4">
          <p className="text-base sm:text-lg font-medium">📍 Nairobi, Kenya</p>
          <p className="text-base sm:text-lg font-medium">📞 0707222419</p>
          <p className="text-base sm:text-lg font-medium">✉️ scaler.com@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default BrochureCover;
