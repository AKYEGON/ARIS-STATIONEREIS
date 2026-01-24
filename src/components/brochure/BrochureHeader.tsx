import logo from "@/assets/logo.png";

const BrochureHeader = () => {
  return (
    <header className="bg-gradient-to-b from-primary/5 to-background border-b-2 border-primary py-4 print:py-3 print:border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="ARIS STATIONERIES Logo" 
              className="h-12 w-12 print:h-10 print:w-10"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground print:text-xl">
                ARIS STATIONERIES
              </h1>
              <p className="text-sm text-muted-foreground print:text-xs">
                THE HOME OF AFFORDABLE STATIONERIES
              </p>
            </div>
          </div>
          <div className="text-right print:text-xs">
            <p className="text-sm text-muted-foreground print:text-[10px]">Product Catalog</p>
            <p className="text-xs text-muted-foreground print:text-[10px]">
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
