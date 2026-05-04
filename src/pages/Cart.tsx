import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/common/SEO";
import ProductImageGallery from "@/components/cart/ProductImageGallery";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";

const checkoutFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  university: z.string().optional(),
  branch: z.string().optional(),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
  agentZone: z.string().optional(),
}).refine((data) => {
  if (data.deliveryMethod === "delivery") {
    return !!data.university && !!data.branch && !!data.deliveryAddress && !!data.agentZone;
  }
  return true;
}, {
  message: "University, branch, delivery address, and agent zone are required for delivery",
  path: ["deliveryMethod"],
}).refine((data) => {
  if (data.deliveryMethod === "delivery" && !data.deliveryAddress) {
    return false;
  }
  return true;
}, {
  message: "Delivery address is required when delivery is selected",
  path: ["deliveryAddress"],
});

const Cart = () => {
  const { cartItems, bundleItems, updateQuantity, updateBundleQuantity, removeFromCart, removeBundleFromCart, getCartTotal, clearCart, getCartItemCount, getDetailedItemCount } = useCart();
  const navigate = useNavigate();
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic checkout options from database
  const [universities, setUniversities] = useState<{id: string; name: string}[]>([]);
  const [branches, setBranches] = useState<{id: string; university_id: string; name: string}[]>([]);
  const [outlets, setOutlets] = useState<{id: string; name: string; location: string | null}[]>([]);
  const [agentZones, setAgentZones] = useState<{id: string; name: string}[]>([]);
  const [selectedPickupOutlet, setSelectedPickupOutlet] = useState("");
  const [selectedAgentZoneId, setSelectedAgentZoneId] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      const [uniRes, branchRes, outletRes, zoneRes] = await Promise.all([
        supabase.from("universities").select("id, name").eq("is_active", true).order("display_order"),
        supabase.from("campus_branches").select("id, university_id, name").eq("is_active", true).order("display_order"),
        supabase.from("pickup_outlets").select("id, name, location").eq("is_active", true).order("display_order"),
        supabase.from("agent_zones").select("id, name").eq("is_active", true).order("display_order"),
      ]);
      if (uniRes.data) setUniversities(uniRes.data);
      if (branchRes.data) setBranches(branchRes.data);
      if (outletRes.data) setOutlets(outletRes.data);
      if (zoneRes.data) setAgentZones(zoneRes.data);
    };
    fetchOptions();
  }, []);

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      university: "",
      branch: "",
      deliveryMethod: "pickup",
      deliveryAddress: "",
      agentZone: "",
    },
  });

  const deliveryMethod = form.watch("deliveryMethod");

  const handleCheckout = () => {
    if (cartItems.length === 0 && bundleItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowCheckoutDialog(true);
  };

  const onSubmit = async (data: z.infer<typeof checkoutFormSchema>) => {
    setIsSubmitting(true);

    // Validate cart has items
    if (cartItems.length === 0 && bundleItems.length === 0) {
      toast.error("Your cart is empty");
      setIsSubmitting(false);
      return;
    }

    console.log("Starting order submission...", { itemCount: cartItems.length });

    try {
      // Prepare order items for server-side validation
      const orderItems: Array<{
        product_id?: string;
        product_name: string;
        product_image: string;
        quantity: number;
        price: number;
      }> = [];

      // Add regular products with their IDs for price verification
      cartItems.forEach(item => {
        const variantLabel = item.selectedVariant 
          ? ` (${item.selectedVariant.variant_type}: ${item.selectedVariant.variant_value})`
          : '';
        orderItems.push({
          product_id: item.id,
          product_name: item.name + variantLabel,
          product_image: item.image,
          quantity: item.quantity,
          price: item.price
        });
      });

      // Add bundle items (expand to individual products)
      bundleItems.forEach(bundle => {
        bundle.items?.forEach(bundleItem => {
          if (bundleItem.product) {
            orderItems.push({
              product_id: bundleItem.product.id,
              product_name: `${bundle.name} - ${bundleItem.product.name}`,
              product_image: bundleItem.product.image,
              quantity: bundleItem.quantity * bundle.quantity,
              price: bundle.bundle_price / (bundle.items?.length || 1) // Distribute bundle price
            });
          }
        });
      });

      console.log("Submitting order via edge function...", orderItems.length);

      // Use server-side edge function for validated order creation
      const { data: orderResult, error: orderError } = await supabase.functions.invoke("create-order", {
        body: {
          customer_name: data.name,
          customer_email: data.phone + "@temp.com",
          customer_phone: data.phone,
          delivery_address: data.deliveryMethod === "delivery" 
            ? `${data.deliveryAddress} (${data.university} - ${data.branch})` 
            : `Pickup at ${selectedPickupOutlet || 'outlet'} (${data.university} - ${data.branch})`,
          items: orderItems,
          agent_zone_id: selectedAgentZoneId || null,
        }
      });

      if (orderError) {
        console.error("Order creation error:", orderError);
        throw new Error(orderError.message || "Failed to create order");
      }

      if (!orderResult?.success) {
        console.error("Order validation failed:", orderResult?.error);
        throw new Error(orderResult?.error || "Order validation failed");
      }

      const orderId = orderResult.orderId;
      const serverTotal = orderResult.total;
      console.log("Order created successfully:", orderId, "Total:", serverTotal);

      // Prepare WhatsApp message
      const productDetails = cartItems
        .map((item, index) => {
          const variantLabel = item.selectedVariant 
            ? ` (${item.selectedVariant.variant_type}: ${item.selectedVariant.variant_value})`
            : '';
          return `${index + 1}. ${item.name}${variantLabel} × ${item.quantity} — KSh ${(item.price * item.quantity).toFixed(2)}`;
        })
        .join("\n");
      
      const bundleDetails = bundleItems
        .map((bundle, index) => {
          const itemsList = bundle.items?.map(bi => 
            `   • ${bi.product?.name || 'Product'} ${bi.quantity > 1 ? `(×${bi.quantity})` : ''}`
          ).join('\n') || '';
          const num = cartItems.length + index + 1;
          return `${num}. ${bundle.name} (Bundle) × ${bundle.quantity} — KSh ${(bundle.bundle_price * bundle.quantity).toFixed(2)}\n${itemsList}`;
        })
        .join("\n\n");
      
      const orderDetails = [productDetails, bundleDetails].filter(Boolean).join("\n");
      
      const itemCounts = getDetailedItemCount();
      const totalUniqueItems = getCartItemCount(); // For cart badge
      const totalItems = itemCounts.total; // For order summary

      const pickupOutletName = selectedPickupOutlet 
        ? outlets.find(o => o.id === selectedPickupOutlet || o.name === selectedPickupOutlet)?.name || selectedPickupOutlet
        : 'N/A';

      let message = `*NEW ORDER — ARIS STATIONERIES*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `*Order ID:* #${orderId.slice(0, 8)}\n`;
      message += `*Date:* ${new Date().toLocaleDateString('en-KE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}\n\n`;
      
      message += `*CUSTOMER DETAILS*\n`;
      message += `• Name: ${data.name}\n`;
      message += `• Phone: ${data.phone}\n`;
      message += `• University/Location: ${data.university}\n`;
      message += `• Campus/Branch: ${data.branch}\n\n`;
      
      message += `*ORDER ITEMS* (${totalItems} item${totalItems !== 1 ? 's' : ''})\n`;
      message += `────────────────────\n`;
      message += `${orderDetails}\n`;
      message += `────────────────────\n`;
      message += `*TOTAL: KSh ${serverTotal.toFixed(2)}*\n\n`;
      
      message += `*DELIVERY METHOD*\n`;
      if (data.deliveryMethod === "pickup") {
        message += `• Pickup in Person\n`;
        message += `• Outlet: ${pickupOutletName}\n`;
      } else {
        message += `• Delivery\n`;
        message += `• Address: ${data.deliveryAddress}\n`;
      }
      if (selectedAgentZoneId) {
        const zoneName = agentZones.find(z => z.id === selectedAgentZoneId)?.name || 'N/A';
        message += `• Agent Zone: ${zoneName}\n`;
      }
      
      message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `_Sent via arisstationaries.co.ke_`;
      
      const whatsappUrl = `https://wa.me/254119774470?text=${encodeURIComponent(message)}`;
      
      // Show success and cleanup state BEFORE redirect
      toast.success(`Order #${orderId.slice(0, 8)} placed! Redirecting to WhatsApp...`);
      setShowCheckoutDialog(false);
      clearCart();
      
      // Small delay to ensure state cleanup completes and toast shows
      setTimeout(() => {
        try {
          console.log("Attempting WhatsApp redirect...");
          // Try opening in new tab first (better UX, less likely to be blocked)
          const newWindow = window.open(whatsappUrl, '_blank');
          
          // If popup was blocked, fall back to same window
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.log("Popup blocked, using fallback redirect");
            window.location.href = whatsappUrl;
          } else {
            console.log("WhatsApp opened in new tab");
          }
        } catch (error) {
          console.error("Redirect error:", error);
          // Final fallback
          window.location.href = whatsappUrl;
        }
      }, 500);
    } catch (error: any) {
      console.error("Order submission failed:", error);
      console.error("Error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      
      // Show specific error message if available
      const errorMessage = error?.message || "Failed to place order. Please try again.";
      toast.error(errorMessage);
      // Keep dialog open so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = getCartTotal();

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SEO
        title="Shopping Cart | Aris Stationeries"
        description="Review your cart and checkout securely at Aris Stationeries. Affordable stationery delivered to your university or doorstep in Kenya."
        canonicalUrl="/cart"
        noindex
      />
      <Header cartItemCount={getCartItemCount()} />
      
      <main className="flex-1 container py-3 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6 lg:mb-8 text-primary">Shopping Cart</h1>
        
        {cartItems.length === 0 && bundleItems.length === 0 ? (
          <Card className="text-center py-8 sm:py-12 md:py-16 transition-all duration-300">
            <CardContent className="flex flex-col items-center gap-3 sm:gap-4">
              <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground" />
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">Your cart is empty</p>
              <Link to="/">
                <Button className="transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90 text-sm sm:text-base">Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            <div className="md:col-span-2 lg:col-span-2 space-y-2 sm:space-y-3 md:space-y-4">
              {/* Bundle Items */}
              {bundleItems.length > 0 && (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-primary mb-1.5 sm:mb-2">Bundle Offers</h2>
                  {bundleItems.map((bundle, index) => (
                    <Card 
                      key={bundle.id} 
                      className="transition-all duration-300 hover:shadow-md animate-fade-in border-2 border-primary/20 overflow-hidden"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardContent className="p-2.5 sm:p-3 md:p-4">
                        <div className="flex gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                          <div className="relative w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex-shrink-0 overflow-hidden rounded-md">
                            <img
                              src={bundle.image}
                              alt={bundle.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0.5 right-0.5 xs:top-1 xs:right-1 sm:top-1 sm:right-1">
                              <span className="bg-primary text-primary-foreground text-[8px] xs:text-[9px] sm:text-[10px] px-0.5 xs:px-1 sm:px-1.5 py-0.5 rounded">
                                Bundle
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="font-semibold text-[10px] xs:text-[11px] sm:text-sm md:text-base lg:text-lg line-clamp-2 sm:truncate">{bundle.name}</h3>
                            {bundle.items && bundle.items.length > 0 && (
                              <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2">
                                Includes: {bundle.items.map(item => 
                                  `${item.product?.name || 'Product'} ${item.quantity > 1 ? `(×${item.quantity})` : ''}`
                                ).join(', ')}
                              </p>
                            )}
                            <div className="flex items-baseline gap-0.5 sm:gap-1 md:gap-2 mt-0.5 sm:mt-1">
                              <span className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-muted-foreground line-through">
                                KSh {bundle.original_total_price.toFixed(2)}
                              </span>
                              <span className="text-[10px] xs:text-xs sm:text-sm md:text-lg lg:text-lg font-bold text-primary">
                                KSh {bundle.bundle_price.toFixed(2)}
                              </span>
                            </div>
                            {/* Mobile controls - inline below price */}
                            <div className="flex items-center justify-between mt-2 sm:hidden">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 transition-all duration-200 active:scale-90"
                                  onClick={() => updateBundleQuantity(bundle.id, bundle.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 text-center font-semibold text-xs">{bundle.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 transition-all duration-200 active:scale-90"
                                  onClick={() => updateBundleQuantity(bundle.id, bundle.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 transition-all duration-200 hover:scale-110 active:scale-95 text-destructive"
                                onClick={() => removeBundleFromCart(bundle.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {/* Desktop controls - right side column */}
                          <div className="hidden sm:flex flex-col items-end gap-2 sm:gap-3 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-9 sm:w-9 transition-all duration-200 hover:scale-110 active:scale-95"
                              onClick={() => removeBundleFromCart(bundle.id)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-9 sm:w-9 transition-all duration-200 active:scale-90"
                                onClick={() => updateBundleQuantity(bundle.id, bundle.quantity - 1)}
                              >
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{bundle.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-9 sm:w-9 transition-all duration-200 active:scale-90"
                                onClick={() => updateBundleQuantity(bundle.id, bundle.quantity + 1)}
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {/* Individual Products */}
              {cartItems.length > 0 && bundleItems.length > 0 && (
                <h2 className="text-lg sm:text-xl font-bold text-primary mt-4 sm:mt-6 mb-1.5 sm:mb-2">Individual Products</h2>
              )}
              {cartItems.map((item, index) => (
                <Card 
                  key={`${item.id}_${item.selectedVariant?.id || 'base'}`} 
                  className="transition-all duration-300 hover:shadow-md animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-2 sm:p-2.5 md:p-3 lg:p-4">
                    <div className="flex gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                      <ProductImageGallery
                        primaryImage={item.image}
                        productName={item.name}
                        media={item.media}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[10px] xs:text-[11px] sm:text-sm md:text-base lg:text-lg truncate">{item.name}</h3>
                        {item.selectedVariant && (
                          <p className="text-[9px] xs:text-[10px] sm:text-xs text-primary font-medium">
                            {item.selectedVariant.variant_type}: {item.selectedVariant.variant_value}
                          </p>
                        )}
                        <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">{item.description}</p>
                        <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-lg font-bold text-primary mt-0.5 sm:mt-1 md:mt-2">
                          KSh {item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9 transition-all duration-200 hover:scale-110 active:scale-95"
                          onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-9 sm:w-9 transition-all duration-200 active:scale-90"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.id)}
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-4 xs:w-5 sm:w-6 md:w-8 text-center font-semibold text-[10px] xs:text-xs sm:text-sm md:text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-9 sm:w-9 transition-all duration-200 active:scale-90"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.id)}
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div>
              <Card className="sticky top-16 sm:top-20 md:top-24 transition-all duration-300">
                <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-6">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-2.5 md:mb-3 lg:mb-4 text-primary">Order Summary</h2>
                  <div className="space-y-1 sm:space-y-1.5 md:space-y-2 mb-2 sm:mb-2.5 md:mb-3 lg:mb-4">
                    <div className="flex justify-between text-xs sm:text-sm md:text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">KSh {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm xs:text-base sm:text-lg font-bold pt-1 sm:pt-1.5 md:pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">KSh {subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full transition-all duration-200 active:scale-95 text-xs sm:text-sm md:text-base" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                  Complete Your Order
                  </Button>
                  <Link to="/">
                    <Button className="w-full mt-2 transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90 text-xs sm:text-sm md:text-base">
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <Footer />

      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-[98vw] xs:max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] xs:max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-2 xs:p-2.5 sm:p-4 md:p-6">
          <DialogHeader className="pb-2 xs:pb-3 sm:pb-4">
            <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary pr-8 xs:pr-10 sm:pr-12">Checkout</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 xs:space-y-2.5 sm:space-y-3 md:space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] xs:text-xs sm:text-sm md:text-base">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} className="h-8 xs:h-9 sm:h-10 md:h-11 lg:h-12 text-xs xs:text-sm sm:text-base" />
                    </FormControl>
                    <FormMessage className="text-[9px] xs:text-[10px] sm:text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] xs:text-xs sm:text-sm md:text-base">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="0712345678" {...field} className="h-8 xs:h-9 sm:h-10 md:h-11 lg:h-12 text-xs xs:text-sm sm:text-base" />
                    </FormControl>
                    <FormMessage className="text-[9px] xs:text-[10px] sm:text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] xs:text-xs sm:text-sm md:text-base">University/Location</FormLabel>
                    <Select onValueChange={(val) => { field.onChange(val); form.setValue("branch", ""); }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 xs:h-9 sm:h-10 md:h-11 lg:h-12 text-xs xs:text-sm sm:text-base">
                          <SelectValue placeholder="Select university/location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {universities.map(u => (
                          <SelectItem key={u.id} value={u.name} className="text-xs xs:text-sm sm:text-base">{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[9px] xs:text-[10px] sm:text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => {
                  const selectedUni = universities.find(u => u.name === form.watch("university"));
                  const filteredBranches = selectedUni 
                    ? branches.filter(b => b.university_id === selectedUni.id)
                    : [];
                  return (
                    <FormItem>
                      <FormLabel className="text-[10px] xs:text-xs sm:text-sm md:text-base">Campus Branch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 xs:h-9 sm:h-10 md:h-11 lg:h-12 text-xs xs:text-sm sm:text-base">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredBranches.map(b => (
                            <SelectItem key={b.id} value={b.name} className="text-xs xs:text-sm sm:text-base">{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[9px] xs:text-[10px] sm:text-xs" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] xs:text-xs sm:text-sm md:text-base">Delivery Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1.5 xs:space-y-2 sm:space-y-3"
                      >
                        <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3">
                          <RadioGroupItem value="pickup" id="pickup" className="h-4 w-4 xs:h-5 xs:w-5" />
                          <Label htmlFor="pickup" className="cursor-pointer text-[10px] xs:text-xs sm:text-sm md:text-base">Pickup in Person from Our Outlets</Label>
                        </div>
                        <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3">
                          <RadioGroupItem value="delivery" id="delivery" className="h-4 w-4 xs:h-5 xs:w-5" />
                          <Label htmlFor="delivery" className="cursor-pointer text-[10px] xs:text-xs sm:text-sm md:text-base">Delivery to My Location</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-[9px] xs:text-[10px] sm:text-xs" />
                  </FormItem>
                )}
              />

              {deliveryMethod === "pickup" && outlets.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] xs:text-xs sm:text-sm md:text-base">Select Pickup Outlet</Label>
                  <Select onValueChange={setSelectedPickupOutlet} value={selectedPickupOutlet}>
                    <SelectTrigger className="h-8 xs:h-9 sm:h-10 md:h-11 lg:h-12 text-xs xs:text-sm sm:text-base">
                      <SelectValue placeholder="Select outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets.map(o => (
                        <SelectItem key={o.id} value={o.name} className="text-xs xs:text-sm sm:text-base">
                          {o.name}{o.location ? ` — ${o.location}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {deliveryMethod === "delivery" && (
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] xs:text-xs sm:text-sm md:text-base">Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your delivery address including building name, room number, or any landmarks"
                          className="min-h-[80px] xs:min-h-[90px] sm:min-h-[100px] text-xs xs:text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[9px] xs:text-[10px] sm:text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {deliveryMethod === "delivery" && agentZones.length > 0 && (
                <FormField
                  control={form.control}
                  name="agentZone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] xs:text-xs sm:text-sm md:text-base">Your Area / Agent Zone *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-8 xs:h-9 sm:h-10 md:h-11 lg:h-12 text-xs xs:text-sm sm:text-base">
                            <SelectValue placeholder="Select your area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {agentZones.map(z => (
                            <SelectItem key={z.id} value={z.id} className="text-xs xs:text-sm sm:text-base">{z.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[9px] xs:text-[10px] sm:text-xs" />
                    </FormItem>
                  )}
                />
              )}

              <div className="border-t pt-3 xs:pt-4">
                <div className="flex justify-between text-sm xs:text-base sm:text-lg md:text-xl font-bold mb-2.5 xs:mb-3 sm:mb-4">
                  <span>Total Amount:</span>
                  <span className="text-primary">KSh {subtotal.toFixed(2)}</span>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-xs xs:text-sm sm:text-base md:text-lg" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? "Placing Order..." : "Complete Order via WhatsApp"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
