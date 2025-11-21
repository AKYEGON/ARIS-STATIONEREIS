import logo from "@/assets/logo.png";

const BrochureHeader = () => {
  return (
    <header className="bg-gradient-to-b from-primary/5 to-background border-b-4 border-primary py-8 print:py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logo} 
              alt="ARIS STATIONARIES Logo" 
              className="h-16 w-16 print:h-12 print:w-12"
            />
            <div>
              <h1 className="text-4xl font-bold text-foreground print:text-3xl">
                ARIS STATIONARIES
              </h1>
              <p className="text-lg text-muted-foreground mt-1 print:text-base">
                Quality Stationery & Office Supplies
              </p>
            </div>
          </div>
          <div className="text-right print:text-sm">
            <p className="text-muted-foreground">Product Catalog</p>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BrochureHeader;
