import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Package, AlertTriangle, Search, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { smartMatch } from "@/lib/smart-search";

interface Variant {
  id: string;
  product_id: string;
  variant_type: string;
  variant_value: string;
  price: number;
  cost_price: number;
  stock: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  cost_price: number;
  stock: number;
  category: string;
  variants?: Variant[];
}

interface StockMovement {
  id: string;
  product_id: string;
  change: number;
  reason: string;
  notes: string | null;
  created_at: string;
}

interface InventoryDashboardProps {
  userRole?: 'admin' | 'manager' | 'employee' | 'agent';
}

export const InventoryDashboard = ({ userRole = 'admin' }: InventoryDashboardProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: "",
    reason: "purchase" as "purchase" | "damage" | "sale" | "correction" | "return",
    notes: ""
  });

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    smartMatch(searchQuery, [product.name, product.category], { fuzzy: true })
  );

  useEffect(() => {
    fetchProducts();
    // Realtime sync with the Products tab so any add/edit/delete reflects here instantly
    const channel = supabase
      .channel('inventory-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .order("name");

      if (error) throw error;
      const shaped = (data || []).map((p: any) => ({
        ...p,
        variants: (p.variants || []).filter((v: any) => v.is_active),
      }));
      setProducts(shaped);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load inventory");
    }
  };

  const fetchStockMovements = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setStockMovements(data || []);
    } catch (error) {
      console.error("Error fetching stock movements:", error);
      toast.error("Failed to load stock history");
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;

    const quantity = parseInt(adjustmentForm.quantity);
    if (isNaN(quantity) || quantity === 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      const { error } = selectedVariant
        ? await supabase.rpc("adjust_variant_stock" as any, {
            p_variant_id: selectedVariant.id,
            p_change: quantity,
            p_reason: adjustmentForm.reason,
            p_notes: adjustmentForm.notes || null,
          })
        : await supabase.rpc("adjust_stock", {
            p_product_id: selectedProduct.id,
            p_change: quantity,
            p_reason: adjustmentForm.reason,
            p_notes: adjustmentForm.notes || null,
          });

      if (error) throw error;

      toast.success("Stock adjusted successfully");
      setIsAdjustDialogOpen(false);
      setAdjustmentForm({ quantity: "", reason: "purchase", notes: "" });
      setSelectedVariant(null);
      fetchProducts();
    } catch (error: any) {
      console.error("Error adjusting stock:", error);
      toast.error(error?.message || "Failed to adjust stock");
    }
  };

  const openAdjustDialog = (product: Product, isIncrease: boolean, variant?: Variant) => {
    setSelectedProduct(product);
    setSelectedVariant(variant || null);
    setAdjustmentForm({
      quantity: "",
      reason: isIncrease ? "purchase" : "damage",
      notes: ""
    });
    setIsAdjustDialogOpen(true);
  };

  const openHistoryDialog = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    fetchStockMovements(product.id);
    setIsHistoryDialogOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const effectiveStock = (p: Product) =>
    p.variants && p.variants.length > 0
      ? p.variants.reduce((s, v) => s + (v.stock || 0), 0)
      : p.stock;

  const effectiveCostValue = (p: Product) =>
    p.variants && p.variants.length > 0
      ? p.variants.reduce((s, v) => s + (v.cost_price || 0) * (v.stock || 0), 0)
      : (p.cost_price || 0) * p.stock;

  const effectiveRevenueValue = (p: Product) =>
    p.variants && p.variants.length > 0
      ? p.variants.reduce((s, v) => s + (v.price || 0) * (v.stock || 0), 0)
      : p.price * p.stock;

  const calculateProfit = (price: number, costPrice: number) => price - costPrice;

  const getTotalInventoryValue = () => products.reduce((s, p) => s + effectiveCostValue(p), 0);
  const getProjectedRevenue = () => products.reduce((s, p) => s + effectiveRevenueValue(p), 0);
  const getProjectedProfit = () => products.reduce((s, p) => s + (effectiveRevenueValue(p) - effectiveCostValue(p)), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Products</CardTitle>
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Stock Units</CardTitle>
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {products.reduce((sum, p) => sum + effectiveStock(p), 0)}
            </div>
          </CardContent>
        </Card>
        {userRole === 'admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Inv. Value</CardTitle>
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                KSh {getTotalInventoryValue().toFixed(0)}
              </div>
            </CardContent>
          </Card>
        )}
        {userRole === 'admin' && (
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Projected Revenue (Sell-out)</CardTitle>
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                KSh {getProjectedRevenue().toFixed(0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                If all stock sold • Profit: KSh {getProjectedProfit().toFixed(0)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Inventory Management</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Product</TableHead>
                  <TableHead className="w-[70px]">Stock</TableHead>
                  {userRole === 'admin' && <TableHead className="hidden sm:table-cell">Cost</TableHead>}
                  <TableHead className="hidden md:table-cell">Sell</TableHead>
                  {userRole === 'admin' && <TableHead className="w-[80px] sm:w-auto">Margin</TableHead>}
                  <TableHead className="text-right w-[100px] sm:w-auto">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const hasVariants = (product.variants?.length || 0) > 0;
                  const totalStock = effectiveStock(product);
                  const lowStock = totalStock <= 5;
                  const profit = calculateProfit(product.price, product.cost_price);
                  const marginPct = product.price > 0 ? (profit / product.price) * 100 : 0;
                  const isExpanded = expanded.has(product.id);
                  return (
                    <>
                    <TableRow key={product.id}>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {hasVariants ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(product.id)}
                              className="p-0.5 -ml-1 rounded hover:bg-muted"
                              aria-label="Toggle variants"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : (
                            <span className="w-4" />
                          )}
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-xs sm:text-sm line-clamp-1">{product.name}</div>
                            <div className="text-[10px] sm:text-sm text-muted-foreground hidden xs:flex items-center gap-1">
                              {product.category}
                              {hasVariants && (
                                <Badge variant="secondary" className="text-[9px] py-0 h-4 gap-0.5">
                                  <Layers className="h-2.5 w-2.5" />
                                  {product.variants!.length} options
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs sm:text-sm ${lowStock ? "text-destructive font-bold" : ""}`}>
                            {totalStock}
                          </span>
                          {lowStock && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        </div>
                      </TableCell>
                      {userRole === 'admin' && (
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">KSh {product.cost_price.toFixed(0)}</TableCell>
                      )}
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm">KSh {product.price.toFixed(0)}</TableCell>
                      {userRole === 'admin' && (
                        <TableCell className="p-2 sm:p-4">
                          <div className="flex flex-col leading-tight">
                            <span className={`text-xs sm:text-sm font-medium ${profit > 0 ? "text-green-600" : "text-red-600"}`}>
                              KSh {profit.toFixed(0)}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {marginPct.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          {(userRole === 'admin' || userRole === 'manager') && !hasVariants && (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => openAdjustDialog(product, true)}
                                className="h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => openAdjustDialog(product, false)}
                                className="h-7 w-7 sm:h-8 sm:w-8"
                              >
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </>
                          )}
                          {(userRole === 'admin' || userRole === 'manager') && hasVariants && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleExpand(product.id)}
                              className="h-7 sm:h-8 text-[10px] sm:text-xs px-2"
                            >
                              {isExpanded ? "Hide" : "Variants"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openHistoryDialog(product)}
                            className="h-7 sm:h-8 text-[10px] sm:text-xs px-2 hidden xs:flex"
                          >
                            Hist
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {hasVariants && isExpanded && product.variants!.map((v) => {
                      const vLow = v.stock <= 5;
                      const vProfit = (v.price || 0) - (v.cost_price || 0);
                      const vMargin = v.price > 0 ? (vProfit / v.price) * 100 : 0;
                      return (
                        <TableRow key={v.id} className="bg-muted/30">
                          <TableCell className="p-2 sm:p-4 pl-8 sm:pl-12">
                            <div className="text-[11px] sm:text-xs">
                              <span className="text-muted-foreground">{v.variant_type}:</span>{" "}
                              <span className="font-medium">{v.variant_value}</span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 sm:p-4">
                            <div className="flex items-center gap-1">
                              <span className={`text-xs ${vLow ? "text-destructive font-bold" : ""}`}>{v.stock}</span>
                              {vLow && <AlertTriangle className="h-3 w-3 text-destructive" />}
                            </div>
                          </TableCell>
                          {userRole === 'admin' && (
                            <TableCell className="hidden sm:table-cell text-xs">KSh {(v.cost_price || 0).toFixed(0)}</TableCell>
                          )}
                          <TableCell className="hidden md:table-cell text-xs">KSh {(v.price || 0).toFixed(0)}</TableCell>
                          {userRole === 'admin' && (
                            <TableCell className="p-2 sm:p-4">
                              <div className="flex flex-col leading-tight">
                                <span className={`text-xs font-medium ${vProfit > 0 ? "text-green-600" : "text-red-600"}`}>
                                  KSh {vProfit.toFixed(0)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{vMargin.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-right p-2 sm:p-4">
                            {(userRole === 'admin' || userRole === 'manager') && (
                              <div className="flex justify-end gap-1">
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => openAdjustDialog(product, true, v)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => openAdjustDialog(product, false, v)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">
              Adjust Stock — {selectedProduct?.name}
              {selectedVariant && (
                <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                  {selectedVariant.variant_type}: {selectedVariant.variant_value}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">
                Current Stock: {selectedVariant ? selectedVariant.stock : selectedProduct?.stock}
              </Label>
            </div>
            <div>
              <Label htmlFor="quantity" className="text-xs sm:text-sm">Quantity Change (+ or -)</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 10 or -5"
                value={adjustmentForm.quantity}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="reason" className="text-xs sm:text-sm">Reason</Label>
              <Select
                value={adjustmentForm.reason}
                onValueChange={(value: any) => setAdjustmentForm({ ...adjustmentForm, reason: value })}
              >
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase/Restock</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="damage">Damage/Loss</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes" className="text-xs sm:text-sm">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add any notes..."
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <Button onClick={handleAdjustStock} className="w-full h-9 sm:h-10 text-sm">
              Adjust Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">Stock History - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-64 sm:max-h-96 overflow-y-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="text-xs sm:text-sm">Change</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden xs:table-cell">Reason</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                      {new Date(movement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="p-2 sm:p-4">
                      <span className={`text-xs sm:text-sm ${movement.change > 0 ? "text-green-600" : "text-red-600"}`}>
                        {movement.change > 0 ? "+" : ""}{movement.change}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xs:table-cell p-2 sm:p-4">
                      <Badge variant="outline" className="text-[10px] sm:text-xs">{movement.reason}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm p-2 sm:p-4">{movement.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
