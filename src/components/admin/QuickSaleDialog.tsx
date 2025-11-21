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
import { Plus, Minus, Trash2, Search, ShoppingCart, Percent, DollarSign } from "lucide-react";
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

      // Calculate total profit and insert order items
      let totalProfit = 0;

      for (const item of selectedItems) {
        const itemProfit = (item.product.price - (item.product.costPrice || 0)) * item.quantity;
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
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Quick Sale - Walk-in Customer
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Left: Product Selection */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Select Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-lg p-2">
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 border rounded hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => addProductToSale(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>KSh {product.price.toFixed(2)}</span>
                        <span>•</span>
                        <span className={product.stock && product.stock > 0 ? "text-green-600" : "text-red-600"}>
                          Stock: {product.stock || 0}
                        </span>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Sale Details */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <Label className="text-sm font-semibold">Sale Items ({selectedItems.length})</Label>
            
            <ScrollArea className="flex-1 border rounded-lg p-2">
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.product.id} className="flex items-center gap-2 p-2 border rounded">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          KSh {item.product.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-semibold text-sm min-w-[60px] text-right">
                        KSh {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator />

            {/* Customer Info */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Customer Details (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Discount</Label>
              <RadioGroup
                value={discountType}
                onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}
                className="flex gap-3"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="percentage" id="quick-percentage" />
                  <Label htmlFor="quick-percentage" className="text-xs cursor-pointer flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    %
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="fixed" id="quick-fixed" />
                  <Label htmlFor="quick-fixed" className="text-xs cursor-pointer flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    KSh
                  </Label>
                </div>
              </RadioGroup>
              <Input
                type="number"
                placeholder="Enter discount"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Total Calculation */}
            <div className="space-y-1 p-3 bg-muted/50 rounded border">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>KSh {calculateSubtotal().toFixed(2)}</span>
              </div>
              {calculateDiscount() > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount:</span>
                  <span>-KSh {calculateDiscount().toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">KSh {calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={completeSale}
              disabled={selectedItems.length === 0 || isProcessing}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isProcessing ? "Processing..." : "Complete Sale"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
