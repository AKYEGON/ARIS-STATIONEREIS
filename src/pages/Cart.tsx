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
import { Form } from "@/components/ui/form";
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
      
      <main className="flex-1 py-6 sm:py-8 md:py-12" style={{ background: "#EFF6F0" }}>
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          {/* ── Section header ── */}
          <div className="mb-6 md:mb-8 flex items-center gap-3">
            {/* Accent pip */}
            <span
              className="hidden sm:block w-1 h-6 rounded-full"
              style={{ background: "linear-gradient(180deg,#5C7A5F,#A8C5AB)" }}
            />
            <div>
              <p
                className="text-[10px] tracking-[0.15em] uppercase font-semibold mb-0.5"
                style={{ color: "#7A9E7E" }}
              >
                Order Summary
              </p>
              <h1
                className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight"
                style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}
              >
                Shopping Cart
              </h1>
            </div>
          </div>
        
        {cartItems.length === 0 && bundleItems.length === 0 ? (
          <div
            className="rounded-2xl p-8 sm:p-12 md:p-16 text-center"
            style={{
              background: "#FFFFFF",
              border: "1px solid #DDE8DF",
              boxShadow: "0 1px 4px rgba(92,122,95,0.06)",
            }}
          >
            <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto mb-4 opacity-40" style={{ color: "#7A8C80" }} />
            <p className="text-[14px] sm:text-[15px] md:text-[16px] mb-4" style={{ color: "#7A8C80" }}>Your cart is empty</p>
            <Link to="/">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-6 text-[12.5px] font-medium transition-colors"
                style={{ background: "#2C3E35", color: "#fff" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#5C7A5F";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#2C3E35";
                }}
              >
                Continue Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Bundle Items */}
              {bundleItems.length > 0 && (
                <>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3" style={{ color: "#2C3E35" }}>Bundle Offers</h2>
                  {bundleItems.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="rounded-2xl p-4 transition-all duration-200 hover:shadow-md"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #DDE8DF",
                        boxShadow: "0 1px 4px rgba(92,122,95,0.06)",
                      }}
                    >
                      <div className="flex gap-3 md:gap-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm md:text-base truncate" style={{ color: "#2C3E35" }}>{bundle.name}</h3>
                          {bundle.items && bundle.items.length > 0 && (
                            <p className="text-sm line-clamp-1 mb-2" style={{ color: "#7A8C80" }}>
                              Includes: {bundle.items.map(item => `${item.product?.name || 'Product'}`).join(', ')}
                            </p>
                          )}
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-xs line-through" style={{ color: "#7A8C80" }}>
                              KSh {bundle.original_total_price.toFixed(2)}
                            </span>
                            <span className="text-base md:text-lg font-bold" style={{ color: "#5C7A5F" }}>
                              KSh {bundle.bundle_price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 border rounded-lg p-1" style={{ borderColor: "#DDE8DF" }}>
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded transition-colors"
                                style={{ background: "#EFF6F0" }}
                                onClick={() => updateBundleQuantity(bundle.id, bundle.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" style={{ color: "#5C7A5F" }} />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{bundle.quantity}</span>
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded transition-colors"
                                style={{ background: "#EFF6F0" }}
                                onClick={() => updateBundleQuantity(bundle.id, bundle.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" style={{ color: "#5C7A5F" }} />
                              </button>
                            </div>
                            <button
                              className="p-2 rounded transition-colors"
                              onClick={() => removeBundleFromCart(bundle.id)}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "#FFE8E8";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <Trash2 className="h-4 w-4" style={{ color: "#D64545" }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Individual Products */}
              {cartItems.length > 0 && (
                <>
                  {bundleItems.length > 0 && <h2 className="text-lg sm:text-xl font-semibold mt-6 mb-3" style={{ color: "#2C3E35" }}>Individual Products</h2>}
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.id}_${item.selectedVariant?.id || 'base'}`}
                        className="rounded-2xl p-4 transition-all duration-200 hover:shadow-md"
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #DDE8DF",
                          boxShadow: "0 1px 4px rgba(92,122,95,0.06)",
                        }}
                      >
                        <div className="flex gap-3 md:gap-4">
                          <ProductImageGallery
                            primaryImage={item.image}
                            productName={item.name}
                            media={item.media}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base truncate" style={{ color: "#2C3E35" }}>{item.name}</h3>
                            {item.selectedVariant && (
                              <p className="text-xs font-medium mb-1" style={{ color: "#5C7A5F" }}>
                                {item.selectedVariant.variant_type}: {item.selectedVariant.variant_value}
                              </p>
                            )}
                            <p className="text-xs line-clamp-1 mb-2" style={{ color: "#7A8C80" }}>{item.description}</p>
                            <p className="text-base md:text-lg font-bold" style={{ color: "#5C7A5F" }}>
                              KSh {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <button
                              className="p-2 rounded transition-colors"
                              onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "#FFE8E8";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <Trash2 className="h-4 w-4" style={{ color: "#D64545" }} />
                            </button>
                            <div className="flex items-center gap-2 border rounded-lg p-1" style={{ borderColor: "#DDE8DF" }}>
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded transition-colors"
                                style={{ background: "#EFF6F0" }}
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.id)}
                              >
                                <Minus className="h-3 w-3" style={{ color: "#5C7A5F" }} />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                className="h-7 w-7 flex items-center justify-center rounded transition-colors"
                                style={{ background: "#EFF6F0" }}
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.id)}
                              >
                                <Plus className="h-3 w-3" style={{ color: "#5C7A5F" }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div>
              <div
                className="sticky top-16 sm:top-20 md:top-24 rounded-2xl p-4 md:p-6 transition-all duration-200"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #DDE8DF",
                  boxShadow: "0 1px 4px rgba(92,122,95,0.06)",
                }}
              >
                <h2 className="text-lg md:text-xl font-bold mb-4" style={{ color: "#2C3E35" }}>Order Summary</h2>
                <div className="space-y-2 mb-4 pb-4" style={{ borderBottom: "1px solid #DDE8DF" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#7A8C80" }}>Subtotal</span>
                    <span className="font-medium" style={{ color: "#2C3E35" }}>KSh {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span style={{ color: "#2C3E35" }}>Total</span>
                    <span style={{ color: "#5C7A5F" }}>KSh {subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  className="w-full rounded-lg py-3 px-6 font-medium text-white text-sm transition-colors mb-2"
                  style={{ background: "#2C3E35" }}
                  onClick={handleCheckout}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#5C7A5F";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#2C3E35";
                  }}
                >
                  Complete Your Order
                </button>
                <Link to="/">
                  <button
                    className="w-full rounded-lg py-3 px-6 font-medium text-sm transition-colors border"
                    style={{
                      color: "#5C7A5F",
                      borderColor: "#DDE8DF",
                      background: "#FFFFFF",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#EFF6F0";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
                    }}
                  >
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
      
      <Footer />

      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent
          className="max-w-[98vw] xs:max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] xs:max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-4 md:p-6"
          style={{ background: "#FFFFFF" }}
        >
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl md:text-2xl font-bold" style={{ color: "#2C3E35", fontFamily: "Georgia, serif" }}>Checkout</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E35" }}>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  {...form.register("name")}
                  className="w-full px-4 py-2 rounded-lg border transition-colors text-sm"
                  style={{
                    borderColor: form.formState.errors.name ? "#D64545" : "#DDE8DF",
                    background: "#FFFFFF",
                    color: "#2C3E35",
                  }}
                  onFocus={(e) => {
                    if (!form.formState.errors.name) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#5C7A5F";
                    }
                  }}
                  onBlur={(e) => {
                    if (!form.formState.errors.name) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#DDE8DF";
                    }
                  }}
                />
                {form.formState.errors.name && <p className="text-xs mt-1" style={{ color: "#D64545" }}>{form.formState.errors.name.message}</p>}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E35" }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="0712345678"
                  {...form.register("phone")}
                  className="w-full px-4 py-2 rounded-lg border transition-colors text-sm"
                  style={{
                    borderColor: form.formState.errors.phone ? "#D64545" : "#DDE8DF",
                    background: "#FFFFFF",
                    color: "#2C3E35",
                  }}
                  onFocus={(e) => {
                    if (!form.formState.errors.phone) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#5C7A5F";
                    }
                  }}
                  onBlur={(e) => {
                    if (!form.formState.errors.phone) {
                      (e.currentTarget as HTMLElement).style.borderColor = "#DDE8DF";
                    }
                  }}
                />
                {form.formState.errors.phone && <p className="text-xs mt-1" style={{ color: "#D64545" }}>{form.formState.errors.phone.message}</p>}
              </div>

              {/* University Field */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E35" }}>University/Location</label>
                <select
                  {...form.register("university")}
                  onChange={(e) => {
                    form.setValue("university", e.target.value);
                    form.setValue("branch", "");
                  }}
                  className="w-full px-4 py-2 rounded-lg border transition-colors text-sm"
                  style={{
                    borderColor: "#DDE8DF",
                    background: "#FFFFFF",
                    color: "#2C3E35",
                  }}
                >
                  <option value="">Select university/location</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>

              {/* Branch Field */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E35" }}>Campus Branch</label>
                <select
                  {...form.register("branch")}
                  className="w-full px-4 py-2 rounded-lg border transition-colors text-sm"
                  style={{
                    borderColor: "#DDE8DF",
                    background: "#FFFFFF",
                    color: "#2C3E35",
                  }}
                >
                  <option value="">Select branch</option>
                  {branches
                    .filter(b => b.university_id === universities.find(u => u.name === form.watch("university"))?.id)
                    .map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                </select>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: "#2C3E35" }}>Delivery Method</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="pickup"
                      value="pickup"
                      {...form.register("deliveryMethod")}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="pickup" className="text-sm cursor-pointer" style={{ color: "#2C3E35" }}>Pickup in Person from Our Outlets</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="delivery"
                      value="delivery"
                      {...form.register("deliveryMethod")}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="delivery" className="text-sm cursor-pointer" style={{ color: "#2C3E35" }}>Delivery to My Location</label>
                  </div>
                </div>
              </div>

              {/* Pickup Outlet Select */}
              {deliveryMethod === "pickup" && outlets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E35" }}>Select Pickup Outlet</label>
                  <select
                    value={selectedPickupOutlet}
                    onChange={(e) => setSelectedPickupOutlet(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border transition-colors text-sm"
                    style={{
                      borderColor: "#DDE8DF",
                      background: "#FFFFFF",
                      color: "#2C3E35",
                    }}
                  >
                    <option value="">Select outlet</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.name}>
                        {o.name}{o.location ? ` — ${o.location}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Delivery Address */}
              {deliveryMethod === "delivery" && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E35" }}>Delivery Address</label>
                  <textarea
                    placeholder="Enter your delivery address including building name, room number, or any landmarks"
                    {...form.register("deliveryAddress")}
                    className="w-full px-4 py-2 rounded-lg border transition-colors text-sm min-h-[100px] resize-none"
                    style={{
                      borderColor: form.formState.errors.deliveryAddress ? "#D64545" : "#DDE8DF",
                      background: "#FFFFFF",
                      color: "#2C3E35",
                    }}
                    onFocus={(e) => {
                      if (!form.formState.errors.deliveryAddress) {
                        (e.currentTarget as HTMLElement).style.borderColor = "#5C7A5F";
                      }
                    }}
                    onBlur={(e) => {
                      if (!form.formState.errors.deliveryAddress) {
                        (e.currentTarget as HTMLElement).style.borderColor = "#DDE8DF";
                      }
                    }}
                  />
                  {form.formState.errors.deliveryAddress && <p className="text-xs mt-1" style={{ color: "#D64545" }}>{form.formState.errors.deliveryAddress.message}</p>}
                </div>
              )}

              {/* Agent Zone */}
              {deliveryMethod === "delivery" && agentZones.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "#2C3E35" }}>Your Area / Agent Zone *</label>
                  <select
                    {...form.register("agentZone")}
                    onChange={(e) => {
                      form.setValue("agentZone", e.target.value);
                      setSelectedAgentZoneId(e.target.value);
                    }}
                    className="w-full px-4 py-2 rounded-lg border transition-colors text-sm"
                    style={{
                      borderColor: "#DDE8DF",
                      background: "#FFFFFF",
                      color: "#2C3E35",
                    }}
                  >
                    <option value="">Select your area</option>
                    {agentZones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Total and Submit */}
              <div style={{ borderTop: "1px solid #DDE8DF" }} className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base font-semibold" style={{ color: "#2C3E35" }}>Total Amount:</span>
                  <span className="text-lg font-bold" style={{ color: "#5C7A5F" }}>KSh {subtotal.toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg py-3 px-6 font-medium text-white text-base transition-colors"
                  style={{
                    background: isSubmitting ? "#A8C5AB" : "#2C3E35",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      (e.currentTarget as HTMLElement).style.background = "#5C7A5F";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      (e.currentTarget as HTMLElement).style.background = "#2C3E35";
                    }
                  }}
                >
                  {isSubmitting ? "Placing Order..." : "Complete Order via WhatsApp"}
                </button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
