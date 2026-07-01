import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Product, ProductVariant } from "@/types/product";
import { Plus, Minus, Trash2, Search, ShoppingCart, Percent, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QuickSaleSuccessDialog } from "./QuickSaleSuccessDialog";
import { smartMatch } from "@/lib/smart-search";

interface QuickSaleItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

interface QuickSaleDialogProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSaleCompleted: () => void;
}

const itemKey = (productId: string, variantId?: string) => `${productId}_${variantId || 'base'}`;

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);
  const [completedSaleData, setCompletedSaleData] = useState<{
    orderId: string;
    total: number;
    itemCount: number;
    customerName: string;
    customerPhone: string;
  } | null>(null);

  const filteredProducts = products.filter(p =>
    smartMatch(searchQuery, [p.name, p.category], { fuzzy: true })
  );

  const addProductToSale = (product: Product, variant?: ProductVariant) => {
    // If product has variants and none picked, open picker
    if (product.variants && product.variants.length > 0 && !variant) {
      setVariantPickerProduct(product);
      return;
    }

    const key = itemKey(product.id, variant?.id);
    const existing = selectedItems.find(item => itemKey(item.product.id, item.variant?.id) === key);
    const availableStock = variant ? (variant.stock ?? 0) : (product.stock ?? 0);

    if (existing) {
      if (existing.quantity + 1 > availableStock) {
        toast.error(`Only ${availableStock} available`);
        return;
      }
      setSelectedItems(selectedItems.map(item =>
        itemKey(item.product.id, item.variant?.id) === key
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (availableStock <= 0) {
        toast.error("Out of stock");
        return;
      }
      setSelectedItems([...selectedItems, {
        product,
        variant,
        quantity: 1,
        unitPrice: variant ? Number(variant.price) : product.price,
        unitCost: variant ? Number(variant.cost_price || 0) : (product.costPrice || 0),
      }]);
      toast.success(`${product.name}${variant ? ` — ${variant.variant_value}` : ''} added`);
    }
  };

  const updateQuantity = (key: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(key);
      return;
    }
    const item = selectedItems.find(i => itemKey(i.product.id, i.variant?.id) === key);
    if (!item) return;
    const availableStock = item.variant ? (item.variant.stock ?? 0) : (item.product.stock ?? 0);
    if (newQuantity > availableStock) {
      toast.error(`Only ${availableStock} available`);
      return;
    }
    setSelectedItems(selectedItems.map(i =>
      itemKey(i.product.id, i.variant?.id) === key ? { ...i, quantity: newQuantity } : i
    ));
  };

  const removeItem = (key: string) => {
    setSelectedItems(selectedItems.filter(i => itemKey(i.product.id, i.variant?.id) !== key));
  };

  const calculateSubtotal = () =>
    selectedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (!discountValue || parseFloat(discountValue) <= 0) return 0;
    if (discountType === "percentage") return subtotal * (parseFloat(discountValue) / 100);
    return parseFloat(discountValue);
  };

  const calculateTotal = () => calculateSubtotal() - calculateDiscount();

  const resetForm = () => {
    setSelectedItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setDeliveryAddress("");
    setDiscountValue("");
    setSearchQuery("");
    setShowSuccessDialog(false);
    setCompletedSaleData(null);
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

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName || "Walk-in Customer",
          customer_phone: customerPhone || "N/A",
          customer_email: customerEmail || "walkin@store.local",
          delivery_address: deliveryAddress || "In-store pickup",
          total,
          subtotal,
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

      let totalProfit = 0;

      for (const item of selectedItems) {
        const itemSubtotal = item.unitPrice * item.quantity;
        const itemProportion = subtotal > 0 ? itemSubtotal / subtotal : 0;
        const itemDiscount = discountAmount * itemProportion;
        const itemActualRevenue = itemSubtotal - itemDiscount;
        const itemCost = item.unitCost * item.quantity;
        const itemProfit = itemActualRevenue - itemCost;
        totalProfit += itemProfit;

        const variantLabel = item.variant ? ` (${item.variant.variant_type}: ${item.variant.variant_value})` : '';

        const { error: itemError } = await supabase
          .from("order_items")
          .insert({
            order_id: order.id,
            product_name: item.product.name + variantLabel,
            product_image: item.product.image,
            quantity: item.quantity,
            price: item.unitPrice,
            cost_price: item.unitCost,
            profit: itemProfit
          });

        if (itemError) throw itemError;

        if (item.variant) {
          const { error: stockError } = await supabase.rpc("adjust_variant_stock", {
            p_variant_id: item.variant.id,
            p_change: -item.quantity,
            p_reason: "sale",
            p_notes: `Walk-in Sale #${order.id.substring(0, 8)}`
          });
          if (stockError) throw stockError;
        } else {
          const { error: stockError } = await supabase.rpc("adjust_stock", {
            p_product_id: item.product.id,
            p_change: -item.quantity,
            p_reason: "sale",
            p_notes: `Walk-in Sale #${order.id.substring(0, 8)}`
          });
          if (stockError) throw stockError;
        }
      }

      await supabase.from("orders").update({ profit: totalProfit }).eq("id", order.id);

      const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
      setCompletedSaleData({
        orderId: order.id,
        total,
        itemCount,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || 'N/A'
      });
      
      toast.success(`Sale completed! Total: KSh ${total.toFixed(2)}`);
      onSaleCompleted();
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error("Error completing sale:", error);
      toast.error(error.message || "Failed to complete sale");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl h-[95vh] md:h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
            Quick Sale - Walk-in Customer
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:grid md:grid-cols-[1fr,1.2fr] gap-0 flex-1 overflow-y-auto md:overflow-hidden">
          {/* Cart Section */}
          <div className="flex flex-col bg-background border-b-4 border-b-primary/20 md:border-b-0 md:order-2">
            <div className="px-3 md:px-4 py-2.5 md:py-3 border-b-2 bg-gradient-to-r from-primary/15 to-primary/5 sticky top-0 z-10 backdrop-blur-sm">
              <Label className="text-xs md:text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart Items {selectedItems.length > 0 && <Badge variant="default" className="text-xs animate-scale-in">{selectedItems.length}</Badge>}
              </Label>
            </div>
            
            <ScrollArea className="flex-1 max-h-[30vh] md:max-h-[calc(85vh-420px)]">
              <div className="p-2 md:p-3">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 md:py-16 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 opacity-20" />
                    <p className="font-medium text-sm md:text-base">No items in cart</p>
                    <p className="text-xs md:text-sm mt-1">Select products to add them</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 md:space-y-2">
                     {selectedItems.map(item => {
                      const key = itemKey(item.product.id, item.variant?.id);
                      return (
                      <div key={key} className="flex items-center gap-1.5 md:gap-2 p-2 md:p-2.5 border rounded-lg bg-card shadow-sm animate-fade-in">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-10 h-10 md:w-12 md:h-12 object-cover rounded border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm truncate">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-[10px] md:text-xs text-primary font-medium truncate">
                              {item.variant.variant_type}: {item.variant.variant_value}
                            </p>
                          )}
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            KSh {item.unitPrice.toFixed(2)} each
                          </p>
                        </div>
                         <div className="flex items-center gap-0.5 md:gap-1 bg-muted/50 rounded-md p-0.5 md:p-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => updateQuantity(key, item.quantity - 1)}>
                            <Minus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                          <span className="w-7 md:w-9 text-center text-xs md:text-sm font-semibold">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => updateQuantity(key, item.quantity + 1)}>
                            <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                          </Button>
                        </div>
                        <p className="font-bold text-xs md:text-sm min-w-[60px] md:min-w-[70px] text-right">
                          KSh {(item.unitPrice * item.quantity).toFixed(2)}
                        </p>
                        <Button size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 hover:bg-destructive/10"
                          onClick={() => removeItem(key)}>
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                        </Button>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t-2 p-3 md:p-4 space-y-2 md:space-y-3 bg-gradient-to-b from-muted/30 to-muted/10 sticky bottom-0 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                <Input placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="text-xs md:text-sm h-8 md:h-9" />
                <Input placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="text-xs md:text-sm h-8 md:h-9" />
              </div>

              <div className="flex gap-1.5 md:gap-2">
                <RadioGroup value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")} className="flex gap-1 md:gap-2">
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
                <Input type="number" placeholder="Discount" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="text-xs md:text-sm h-8 md:h-9 flex-1" />
              </div>

              <div className="space-y-1.5 md:space-y-2 p-2.5 md:p-3 bg-gradient-to-br from-primary/5 to-background rounded-lg border-2 border-primary/20 shadow-sm">
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

              <Button onClick={completeSale} disabled={selectedItems.length === 0 || isProcessing}
                className="w-full h-11 md:h-12 text-sm md:text-base font-semibold" size="lg">
                {isProcessing ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </div>

          {/* Product Selection */}
          <div className="flex flex-col md:border-r bg-muted/5 md:order-1">
            <div className="px-3 md:px-4 py-2.5 md:py-3 border-b bg-gradient-to-r from-muted/50 to-muted/30 sticky top-0 z-10 backdrop-blur-sm">
              <Label className="text-xs md:text-sm font-semibold mb-1.5 md:mb-2 block">Select Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 md:pl-9 h-8 md:h-9 text-sm" />
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[40vh] md:max-h-[calc(85vh-200px)]">
              <div className="p-2 md:p-3 space-y-1.5 md:space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <Package className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-1.5 md:mb-2 opacity-30" />
                    <p className="text-xs md:text-sm">No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const hasVariants = !!(product.variants && product.variants.length > 0);
                    const totalStock = hasVariants
                      ? product.variants!.reduce((s, v) => s + (v.stock ?? 0), 0)
                      : (product.stock ?? 0);
                    return (
                     <button
                      key={product.id}
                      className="w-full flex items-center gap-2 md:gap-3 p-2.5 md:p-3 border rounded-lg hover:bg-accent hover:border-primary/50 cursor-pointer transition-all text-left active:scale-[0.98] hover:shadow-sm"
                      onClick={() => addProductToSale(product)}
                    >
                      <img src={product.image} alt={product.name} className="w-10 h-10 md:w-12 md:h-12 object-cover rounded border" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs md:text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs mt-0.5 flex-wrap">
                          <span className="font-semibold text-primary">KSh {product.price.toFixed(2)}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className={totalStock > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {totalStock} in stock
                          </span>
                          {hasVariants && (
                            <Badge variant="outline" className="text-[9px] py-0 h-4">
                              {product.variants!.length} variants
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Plus className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    </button>
                  )})
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      {/* Variant picker dialog */}
      <Dialog open={!!variantPickerProduct} onOpenChange={(o) => !o && setVariantPickerProduct(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Choose variant — {variantPickerProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {variantPickerProduct?.variants?.map(v => {
              const outOfStock = (v.stock ?? 0) <= 0;
              return (
                <button
                  key={v.id}
                  disabled={outOfStock}
                  onClick={() => {
                    addProductToSale(variantPickerProduct, v);
                    setVariantPickerProduct(null);
                  }}
                  className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-all"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {v.variant_type}: <span className="text-primary">{v.variant_value}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      KSh {Number(v.price).toFixed(2)} • {v.stock ?? 0} in stock
                      {v.sku && ` • SKU ${v.sku}`}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {completedSaleData && (
        <QuickSaleSuccessDialog
          open={showSuccessDialog}
          onClose={handleSuccessDialogClose}
          saleData={completedSaleData}
        />
      )}
    </Dialog>
  );
};
