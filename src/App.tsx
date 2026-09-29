import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import Index from "./pages/Index";
import ScrollToTop from "./components/common/ScrollToTop";
import PixelRouteTracker from "./components/common/PixelRouteTracker";

const Cart = lazy(() => import("./pages/Cart"));
const Admin = lazy(() => import("./pages/Admin"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Shop = lazy(() => import("./pages/Shop"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Deals = lazy(() => import("./pages/Deals"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding"));
const SubcategoryLanding = lazy(() => import("./pages/SubcategoryLanding"));
const ReviewSubmit = lazy(() => import("./pages/ReviewSubmit"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const SchoolList = lazy(() => import("./pages/SchoolList"));

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <p className="text-lg">Loading...</p>
  </div>
);


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
              <Suspense fallback={<PageFallback />}>
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
                <Route path="/category/:parentSlug/:slug" element={<SubcategoryLanding />} />
                <Route path="/review/:token" element={<ReviewSubmit />} />
                <Route path="/school-list" element={<SchoolList />} />
                <Route path="/about" element={<LegalPage />} />
                <Route path="/contact" element={<LegalPage />} />

                <Route path="/privacy" element={<LegalPage />} />
                <Route path="/returns" element={<LegalPage />} />
                <Route path="/terms" element={<LegalPage />} />
                <Route path="*" element={<NotFound />} />
                {/*Comment  */}
              </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
