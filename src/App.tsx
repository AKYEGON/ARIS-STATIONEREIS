import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Brochure from "./pages/Brochure";
import Testimonials from "./pages/Testimonials";
import Offers from "./pages/Offers";
import NotFound from "./pages/NotFound";

import DeliveryBanner from "@/components/layout/DeliveryBanner";
import DeliveryModal from "@/components/layout/DeliveryModal";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <DeliveryBanner onOpenDetails={() => setDeliveryOpen(true)} />
        <DeliveryModal open={deliveryOpen} onClose={() => setDeliveryOpen(false)} />

        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/brochure" element={<Brochure />} />
                <Route path="/testimonials" element={<Testimonials />} />
                {/* /happy-customers redirects to /testimonials inside the component to avoid duplicate content */}
                <Route path="/happy-customers" element={<Testimonials />} />
                <Route path="/offers" element={<Offers />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
