import logo from "@/assets/logo.png";

const BrochureCover = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-8 print:page-break-after">
      <div className="text-center space-y-8">
        <img 
          src={logo} 
          alt="ARIS STATIONARIES Logo" 
          className="h-32 w-32 mx-auto print:h-24 print:w-24"
        />
        
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-foreground print:text-5xl">
            ARIS STATIONARIES
          </h1>
          <p className="text-2xl text-muted-foreground print:text-xl">
            Quality Stationery & Office Supplies
          </p>
        </div>

        <div className="mt-16 space-y-2 text-muted-foreground">
          <p className="text-lg print:text-base">Product Catalog</p>
          <p className="text-base print:text-sm">
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        <div className="mt-24 pt-8 border-t border-border space-y-2 text-sm text-muted-foreground print:text-xs">
          <p>📍 Nairobi, Kenya</p>
          <p>📞 +254 123 456 789</p>
          <p>✉️ info@arisstationaries.com</p>
        </div>
      </div>
    </div>
  );
};

export default BrochureCover;
