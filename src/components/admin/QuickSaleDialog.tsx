import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types/product";
import { Plus, Minus, Trash2, Search, ShoppingCart, Percent, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuickSaleItem {
  product: Product;
  quantity: number;
}

interface QuickSaleDialogProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSaleCompleted: () => void;
}

export const QuickSaleDialog = ({ open, onClose, products, onSaleCompleted }: QuickSaleDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<QuickSaleItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addProductToSale = (product: Product) => {
    const existing = selectedItems.find(item => item.product.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1 }]);
      toast.success(`${product.name} added to sale`);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && product.stock && newQuantity > product.stock) {
      toast.error(`Only ${product.stock} units available`);
      return;
    }

    setSelectedItems(selectedItems.map(item =>
      item.product.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (!discountValue || parseFloat(discountValue) <= 0) return 0;

    if (discountType === "percentage") {
      const percentage = parseFloat(discountValue);
      return subtotal * (percentage / 100);
    } else {
      return parseFloat(discountValue);
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const resetForm = () => {
    setSelectedItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDeliveryAddress("");
    setDiscountValue("");
    setSearchQuery("");
  };

  const completeSale = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    setIsProcessing(true);
    try {
      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscount();
      const total = calculateTotal();

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName || "Walk-in Customer",
          customer_phone: customerPhone || "N/A",
          customer_email: customerEmail || "walkin@store.local",
          delivery_address: deliveryAddress || "In-store pickup",
          total: total,
          subtotal: subtotal,
          original_total: subtotal,
          discount_amount: discountAmount,
          discount_type: discountAmount > 0 ? discountType : null,
          status: "delivered",
          completed_at: new Date().toISOString(),
          tags: ["Walk-in"]
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Calculate total profit with discount distribution
      let totalProfit = 0;

      for (const item of selectedItems) {
        // Calculate item's subtotal
        const itemSubtotal = item.product.price * item.quantity;
        
        // Calculate item's proportion of total and its share of discount
        const itemProportion = subtotal > 0 ? itemSubtotal / subtotal : 0;
        const itemDiscount = discountAmount * itemProportion;
        
        // Calculate actual revenue after discount for this item
        const itemActualRevenue = itemSubtotal - itemDiscount;
        
        // Calculate cost for this item
        const itemCost = (item.product.costPrice || 0) * item.quantity;
        
        // Calculate real profit (revenue - cost)
        const itemProfit = itemActualRevenue - itemCost;
        totalProfit += itemProfit;

        // Insert order item
        const { error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            product_name: item.product.name,
            product_image: item.product.image,
            quantity: item.quantity,
            price: item.product.price,
            cost_price: item.product.costPrice || 0,
            profit: itemProfit
          });

        if (itemError) throw itemError;

        // Reduce stock using the adjust_stock function
        const { error: stockError } = await supabase.rpc("adjust_stock", {
          p_product_id: item.product.id,
          p_change: -item.quantity,
          p_reason: "sale",
          p_notes: `Walk-in Sale #${order.id.substring(0, 8)}`
        });

        if (stockError) throw stockError;
      }

      // Update order with profit
      await supabase
        .from("orders")
        .update({ profit: totalProfit })
        .eq("id", order.id);

      toast.success(`Sale completed! Total: KSh ${total.toFixed(2)}`);
      resetForm();
      onSaleCompleted();
      onClose();
    } catch (error: any) {
      console.error("Error completing sale:", error);
      toast.error(error.message || "Failed to complete sale");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl h-[90vh] md:h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
            Quick Sale - Walk-in Customer
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:grid md:grid-cols-[1fr,1.2fr] gap-0 flex-1 overflow-hidden">
          {/* Left: Product Selection */}
          <div className="flex flex-col md:border-r border-b md:border-b-0">
            <div className="px-3 md:px-4 py-2 md:py-3 border-b bg-muted/30">
              <Label className="text-xs md:text-sm font-semibold mb-1.5 md:mb-2 block">Select Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 md:pl-9 h-8 md:h-9 text-sm"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 h-[30vh] md:h-[calc(85vh-200px)]">
              <div className="p-2 md:p-3 space-y-1.5 md:space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <Package className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-1.5 md:mb-2 opacity-30" />
                    <p className="text-xs md:text-sm">No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      className="w-full flex items-center gap-2 md:gap-3 p-2 md:p-2.5 border rounded-lg hover:bg-accent hover:border-primary/50 cursor-pointer transition-all text-left active:scale-95"
                      onClick={() => addProductToSale(product)}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 md:w-12 md:h-12 object-cover rounded border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs md:text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs mt-0.5">
                          <span className="font-semibold text-primary">KSh {product.price.toFixed(2)}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className={product.stock && product.stock > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {product.stock || 0} in stock
                          </span>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Sale Details */}
          <div className="flex flex-col">
            <div className="px-3 md:px-4 py-2 md:py-3 border-b bg-muted/30">
              <Label className="text-xs md:text-sm font-semibold">
                Cart Items {selectedItems.length > 0 && `(${selectedItems.length})`}
              </Label>
            </div>
            
            <ScrollArea className="flex-1 h-[25vh] md:h-[calc(85vh-420px)]">
              <div className="p-2 md:p-3">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 md:py-16 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 opacity-20" />
                    <p className="font-medium text-sm md:text-base">No items in cart</p>
                    <p className="text-xs md:text-sm mt-1">Select products to add them</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 md:space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.product.id} className="flex items-center gap-1.5 md:gap-2 p-2 md:p-2.5 border rounded-lg bg-background">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-10 h-10 md:w-12 md:h-12 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm truncate">{item.product.name}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            KSh {item.product.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 md:gap-1 bg-muted/50 rounded-md p-0.5 md:p-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 md:h-7 md:w-7 hover:bg-background"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          </Button>
                          <span className="w-6 md:w-8 text-center text-xs md:text-sm font-semibold">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 md:h-7 md:w-7 hover:bg-background"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          </Button>
                        </div>
                        <p className="font-bold text-xs md:text-sm min-w-[60px] md:min-w-[70px] text-right">
                          KSh {(item.product.price * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 md:h-8 md:w-8 hover:bg-destructive/10"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-3 md:p-4 space-y-2 md:space-y-3 bg-muted/20">
              {/* Customer Info - Compact */}
              <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                <Input
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-xs md:text-sm h-8 md:h-9"
                />
                <Input
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-xs md:text-sm h-8 md:h-9"
                />
              </div>

              {/* Discount - Compact */}
              <div className="flex gap-1.5 md:gap-2">
                <RadioGroup
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}
                  className="flex gap-1 md:gap-2"
                >
                  <div className="flex items-center space-x-1 md:space-x-1.5 border rounded px-2 md:px-3 py-1 md:py-1.5 bg-background">
                    <RadioGroupItem value="percentage" id="quick-percentage" className="h-3 w-3 md:h-4 md:w-4" />
                    <Label htmlFor="quick-percentage" className="text-[10px] md:text-xs cursor-pointer flex items-center gap-0.5 md:gap-1">
                      <Percent className="h-2.5 w-2.5 md:h-3 md:w-3" />%
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1 md:space-x-1.5 border rounded px-2 md:px-3 py-1 md:py-1.5 bg-background">
                    <RadioGroupItem value="fixed" id="quick-fixed" className="h-3 w-3 md:h-4 md:w-4" />
                    <Label htmlFor="quick-fixed" className="text-[10px] md:text-xs cursor-pointer flex items-center gap-0.5 md:gap-1">
                      <DollarSign className="h-2.5 w-2.5 md:h-3 md:w-3" />KSh
                    </Label>
                  </div>
                </RadioGroup>
                <Input
                  type="number"
                  placeholder="Discount"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="text-xs md:text-sm h-8 md:h-9 flex-1"
                />
              </div>

              {/* Total Section */}
              <div className="space-y-1.5 md:space-y-2 p-2 md:p-3 bg-background rounded-lg border-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">KSh {calculateSubtotal().toFixed(2)}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-green-600 dark:text-green-400">Discount:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">-KSh {calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-base md:text-lg">Total:</span>
                  <span className="font-bold text-xl md:text-2xl text-primary">KSh {calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={completeSale}
                disabled={selectedItems.length === 0 || isProcessing}
                className="w-full h-10 md:h-11 text-sm md:text-base font-semibold active:scale-95"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
