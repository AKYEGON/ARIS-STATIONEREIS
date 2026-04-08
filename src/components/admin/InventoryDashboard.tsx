import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Package, AlertTriangle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  cost_price: number;
  stock: number;
  category: string;
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
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: "",
    reason: "purchase" as "purchase" | "damage" | "sale" | "correction" | "return",
    notes: ""
  });

  // Filter products based on search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
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
      const { error } = await supabase.rpc("adjust_stock", {
        p_product_id: selectedProduct.id,
        p_change: quantity,
        p_reason: adjustmentForm.reason,
        p_notes: adjustmentForm.notes || null
      });

      if (error) throw error;

      toast.success("Stock adjusted successfully");
      setIsAdjustDialogOpen(false);
      setAdjustmentForm({ quantity: "", reason: "purchase", notes: "" });
      fetchProducts();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    }
  };

  const openAdjustDialog = (product: Product, isIncrease: boolean) => {
    setSelectedProduct(product);
    setAdjustmentForm({
      quantity: isIncrease ? "" : "",
      reason: isIncrease ? "purchase" : "damage",
      notes: ""
    });
    setIsAdjustDialogOpen(true);
  };

  const openHistoryDialog = (product: Product) => {
    setSelectedProduct(product);
    fetchStockMovements(product.id);
    setIsHistoryDialogOpen(true);
  };

  const calculateProfit = (price: number, costPrice: number) => {
    return price - costPrice;
  };

  const getTotalInventoryValue = () => {
    return products.reduce((sum, p) => sum + (p.cost_price * p.stock), 0);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-3">
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
              {products.reduce((sum, p) => sum + p.stock, 0)}
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
                  {userRole === 'admin' && <TableHead className="hidden lg:table-cell">Profit</TableHead>}
                  <TableHead className="text-right w-[100px] sm:w-auto">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const profit = calculateProfit(product.price, product.cost_price);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium text-xs sm:text-sm line-clamp-1">{product.name}</div>
                            <div className="text-[10px] sm:text-sm text-muted-foreground hidden xs:block">{product.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs sm:text-sm ${product.stock <= 5 ? "text-destructive font-bold" : ""}`}>
                            {product.stock}
                          </span>
                          {product.stock <= 5 && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      {userRole === 'admin' && (
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">KSh {product.cost_price.toFixed(0)}</TableCell>
                      )}
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm">KSh {product.price.toFixed(0)}</TableCell>
                      {userRole === 'admin' && (
                        <TableCell className="hidden lg:table-cell">
                          <span className={`text-xs sm:text-sm ${profit > 0 ? "text-green-600 font-medium" : "text-red-600"}`}>
                            KSh {profit.toFixed(0)}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          {userRole !== 'employee' && (
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
            <DialogTitle className="text-sm sm:text-base">Adjust Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label className="text-xs sm:text-sm">Current Stock: {selectedProduct?.stock}</Label>
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
