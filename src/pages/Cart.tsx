import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
import { useState } from "react";

const checkoutFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  university: z.string().min(1, "Please select a university"),
  branch: z.string().min(1, "Please select a branch"),
  deliveryMethod: z.enum(["pickup", "delivery"]),
  deliveryAddress: z.string().optional(),
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
  const { cartItems, bundleItems, updateQuantity, updateBundleQuantity, removeFromCart, removeBundleFromCart, getCartTotal, clearCart, getCartItemCount } = useCart();
  const navigate = useNavigate();
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      university: "",
      branch: "",
      deliveryMethod: "pickup",
      deliveryAddress: "",
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
    const total = getCartTotal();

    // Validate cart has items
    if (cartItems.length === 0 && bundleItems.length === 0) {
      toast.error("Your cart is empty");
      setIsSubmitting(false);
      return;
    }

    console.log("Starting order submission...", { total, itemCount: cartItems.length });

    try {
      // Generate order ID client-side to avoid RLS SELECT issues
      const orderId = crypto.randomUUID();
      
      // Create order in database
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          customer_name: data.name,
          customer_email: data.phone + "@temp.com", // Use phone as temp email since field is required
          customer_phone: data.phone,
          delivery_address: data.deliveryMethod === "delivery" 
            ? `${data.deliveryAddress} (${data.university} - ${data.branch})` 
            : `Pickup at ${data.university} - ${data.branch}`,
          total: total,
          subtotal: total,
          status: "Pending"
        });

      if (orderError) {
        console.error("Order creation error:", orderError);
        throw orderError;
      }

      console.log("Order created successfully:", orderId);

      // Create order items for regular products
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        price: item.price
      }));

      // Create order items for bundles (expand to individual products)
      bundleItems.forEach(bundle => {
        bundle.items?.forEach(bundleItem => {
          if (bundleItem.product) {
            orderItems.push({
              order_id: orderId,
              product_name: `${bundle.name} - ${bundleItem.product.name}`,
              product_image: bundleItem.product.image,
              quantity: bundleItem.quantity * bundle.quantity,
              price: bundle.bundle_price / (bundle.items?.length || 1) // Distribute bundle price
            });
          }
        });
      });

      console.log("Inserting order items...", orderItems.length);

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items creation error:", itemsError);
        throw itemsError;
      }

      console.log("Order items created successfully");

      // Prepare WhatsApp message
      const productDetails = cartItems
        .map((item) => `${item.name} x${item.quantity} - KSh ${(item.price * item.quantity).toFixed(2)}`)
        .join("\n");
      
      const bundleDetails = bundleItems
        .map((bundle) => {
          const itemsList = bundle.items?.map(bi => 
            `  • ${bi.product?.name || 'Product'} ${bi.quantity > 1 ? `(×${bi.quantity})` : ''}`
          ).join('\n') || '';
          return `${bundle.name} (Bundle) x${bundle.quantity} - KSh ${(bundle.bundle_price * bundle.quantity).toFixed(2)}\n${itemsList}`;
        })
        .join("\n\n");
      
      const orderDetails = [productDetails, bundleDetails].filter(Boolean).join("\n\n");
      
      let message = `New Order from ARIS STATIONARIES\n\n`;
      message += `Order ID: ${orderId.slice(0, 8)}\n\n`;
      message += `Customer Details:\n`;
      message += `Name: ${data.name}\n`;
      message += `Phone: ${data.phone}\n`;
      message += `University: ${data.university}\n`;
      message += `Branch: ${data.branch}\n\n`;
      message += `Order Details:\n${orderDetails}\n\n`;
      message += `Total Amount: KSh ${total.toFixed(2)}\n\n`;
      message += `Delivery Method: ${data.deliveryMethod === "pickup" ? "Pickup in Person" : "Delivery"}\n`;
      
      if (data.deliveryMethod === "delivery" && data.deliveryAddress) {
        message += `Delivery Address: ${data.deliveryAddress}\n`;
      }
      
      const whatsappUrl = `https://wa.me/254707222419?text=${encodeURIComponent(message)}`;
      
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
    <div className="min-h-screen flex flex-col">
      <Header cartItemCount={getCartItemCount()} />
      
      <main className="flex-1 container py-4 sm:py-6 md:py-8 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-primary">Shopping Cart</h1>
        
        {cartItems.length === 0 && bundleItems.length === 0 ? (
          <Card className="text-center py-12 sm:py-16 transition-all duration-300">
            <CardContent className="flex flex-col items-center gap-4">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
              <p className="text-lg sm:text-xl text-muted-foreground">Your cart is empty</p>
              <Link to="/">
                <Button className="transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90">Continue Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Bundle Items */}
              {bundleItems.length > 0 && (
                <>
                  <h2 className="text-xl font-bold text-primary mb-2">Bundle Offers</h2>
                  {bundleItems.map((bundle, index) => (
                    <Card 
                      key={bundle.id} 
                      className="transition-all duration-300 hover:shadow-md animate-fade-in border-2 border-primary/20"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-md">
                            <img
                              src={bundle.image}
                              alt={bundle.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 right-1">
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                                Bundle
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base md:text-lg truncate">{bundle.name}</h3>
                            {bundle.items && bundle.items.length > 0 && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                Includes: {bundle.items.map(item => 
                                  `${item.product?.name || 'Product'} ${item.quantity > 1 ? `(×${item.quantity})` : ''}`
                                ).join(', ')}
                              </p>
                            )}
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-xs text-muted-foreground line-through">
                                KSh {bundle.original_total_price.toFixed(2)}
                              </span>
                              <span className="text-base sm:text-lg font-bold text-primary">
                                KSh {bundle.bundle_price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 sm:gap-3">
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
                <h2 className="text-xl font-bold text-primary mt-6 mb-2">Individual Products</h2>
              )}
              {cartItems.map((item, index) => (
                <Card 
                  key={item.id} 
                  className="transition-all duration-300 hover:shadow-md animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <ProductImageGallery
                        primaryImage={item.image}
                        productName={item.name}
                        media={item.media}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base md:text-lg truncate">{item.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">{item.description}</p>
                        <p className="text-base sm:text-lg font-bold text-primary mt-1 sm:mt-2">
                          KSh {item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 sm:gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 sm:h-9 sm:w-9 transition-all duration-200 hover:scale-110 active:scale-95"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-9 sm:w-9 transition-all duration-200 active:scale-90"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-9 sm:w-9 transition-all duration-200 active:scale-90"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
              <Card className="sticky top-20 sm:top-24 transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-primary">Order Summary</h2>
                  <div className="space-y-2 mb-3 sm:mb-4">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">KSh {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">KSh {subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full transition-all duration-200 active:scale-95" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Complete Your Order
                  </Button>
                  <Link to="/">
                    <Button className="w-full mt-2 transition-all duration-200 active:scale-95 bg-primary hover:bg-primary/90">
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Checkout</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="0712345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="University of Nairobi">University of Nairobi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campus Branch</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Chiromo">Chiromo</SelectItem>
                        <SelectItem value="Main Campus">Main Campus</SelectItem>
                        <SelectItem value="Kikuyu">Kikuyu</SelectItem>
                        <SelectItem value="Lower Kabete">Lower Kabete</SelectItem>
                        <SelectItem value="A.D.D">A.D.D</SelectItem>
                        <SelectItem value="Parklands">Parklands</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup" className="cursor-pointer">Pickup in Person from Our Outlets</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery" className="cursor-pointer">Delivery to My Location</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {deliveryMethod === "delivery" && (
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your delivery address including building name, room number, or any landmarks"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total Amount:</span>
                  <span className="text-primary">KSh {subtotal.toFixed(2)}</span>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={isSubmitting}>
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
