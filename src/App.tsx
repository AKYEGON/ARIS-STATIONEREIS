import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Shop from "./pages/Shop";
import Testimonials from "./pages/Testimonials";
import Offers from "./pages/Offers";
import Deals from "./pages/Deals";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import CategoryLanding from "./pages/CategoryLanding";
import ReviewSubmit from "./pages/ReviewSubmit";
import ScrollToTop from "./components/common/ScrollToTop";
import LegalPage from "./pages/LegalPage";
import PixelRouteTracker from "./components/common/PixelRouteTracker";

const queryClient = new QueryClient();

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <PixelRouteTracker />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/students" element={<Navigate to="/shop" replace />} />
                <Route path="/brochure" element={<Navigate to="/shop" replace />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/happy-customers" element={<Navigate to="/testimonials" replace />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/offers" element={<Navigate to="/deals" replace />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/category/:slug" element={<CategoryLanding />} />
                <Route path="/review/:token" element={<ReviewSubmit />} />
                <Route path="/about" element={<LegalPage />} />
                <Route path="/contact" element={<LegalPage />} />
                <Route path="/privacy" element={<LegalPage />} />
                <Route path="/returns" element={<LegalPage />} />
                <Route path="/terms" element={<LegalPage />} />
                <Route path="*" element={<NotFound />} />
                {/*Comment  */}
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
