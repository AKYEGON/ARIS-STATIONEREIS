import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Brochure from "./pages/Brochure";
import Testimonials from "./pages/Testimonials";
import Offers from "./pages/Offers";
import NotFound from "./pages/NotFound";

import DeliveryBanner from "@/components/DeliveryBanner";
import DeliveryModal from "@/components/DeliveryModal";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  return (
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
      <Route path="/happy-customers" element={<Testimonials />} />
      <Route path="/offers" element={<Offers />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
