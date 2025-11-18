import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Package, AlertTriangle } from "lucide-react";
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

export const InventoryDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: "",
    reason: "purchase" as "purchase" | "damage" | "sale" | "correction" | "return",
    notes: ""
  });

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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.stock, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KSh {getTotalInventoryValue().toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Profit/Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const profit = calculateProfit(product.price, product.cost_price);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.category}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={product.stock <= 5 ? "text-destructive font-bold" : ""}>
                          {product.stock}
                        </span>
                        {product.stock <= 5 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>KSh {product.cost_price.toFixed(2)}</TableCell>
                    <TableCell>KSh {product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={profit > 0 ? "text-green-600 font-medium" : "text-red-600"}>
                        KSh {profit.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustDialog(product, true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustDialog(product, false)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openHistoryDialog(product)}
                        >
                          History
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Stock: {selectedProduct?.stock}</Label>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity Change (+ or -)</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g., 10 or -5"
                value={adjustmentForm.quantity}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select
                value={adjustmentForm.reason}
                onValueChange={(value: any) => setAdjustmentForm({ ...adjustmentForm, reason: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add any notes..."
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleAdjustStock} className="w-full">
              Adjust Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock History - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={movement.change > 0 ? "text-green-600" : "text-red-600"}>
                        {movement.change > 0 ? "+" : ""}{movement.change}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{movement.reason}</Badge>
                    </TableCell>
                    <TableCell>{movement.notes || "-"}</TableCell>
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
