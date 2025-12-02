import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Minus } from "lucide-react";
import { Bundle } from "@/types/bundle";
import { Product } from "@/types/product";

interface BundlesTabProps {
  bundles: Bundle[];
  products: Product[];
  isDialogOpen: boolean;
  editingBundle: Bundle | null;
  formData: any;
  imagePreview: string;
  selectedProducts: Array<{ product_id: string; quantity: number }>;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
  onFormChange: (field: string, value: any) => void;
  onImageChange: (file: File | null) => void;
  onProductAdd: (productId: string) => void;
  onProductRemove: (productId: string) => void;
  onProductQuantityChange: (productId: string, quantity: number) => void;
  onSave: () => void;
  onEdit: (bundle: Bundle) => void;
  onDelete: (id: string) => void;
}

export const BundlesTab = ({
  bundles,
  products,
  isDialogOpen,
  editingBundle,
  formData,
  imagePreview,
  selectedProducts,
  onOpenDialog,
  onCloseDialog,
  onFormChange,
  onImageChange,
  onProductAdd,
  onProductRemove,
  onProductQuantityChange,
  onSave,
  onEdit,
  onDelete
}: BundlesTabProps) => {
  const calculateOriginalTotal = () => {
    return selectedProducts.reduce((total, sp) => {
      const product = products.find(p => p.id === sp.product_id);
      return total + (product ? product.price * sp.quantity : 0);
    }, 0);
  };

  const calculateSavings = () => {
    const original = calculateOriginalTotal();
    const bundlePrice = parseFloat(formData.bundle_price) || 0;
    return original - bundlePrice;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Bundle Offers</CardTitle>
          <Button onClick={onOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Bundle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Bundle Price</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Savings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.map((bundle) => {
              const savings = bundle.original_total_price - bundle.bundle_price;
              return (
                <TableRow key={bundle.id}>
                  <TableCell className="font-medium">{bundle.name}</TableCell>
                  <TableCell>{bundle.items?.length || 0} items</TableCell>
                  <TableCell>KSh {bundle.bundle_price.toFixed(2)}</TableCell>
                  <TableCell className="line-through text-muted-foreground">
                    KSh {bundle.original_total_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    KSh {savings.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={bundle.is_active ? "default" : "secondary"}>
                      {bundle.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => onEdit(bundle)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => onDelete(bundle.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={onCloseDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBundle ? "Edit Bundle" : "Create Bundle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bundle Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => onFormChange("name", e.target.value)}
                  placeholder="Back to School Set"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => onFormChange("description", e.target.value)}
                  placeholder="Perfect bundle for students"
                />
              </div>
              <div>
                <Label>Bundle Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                />
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />}
              </div>
              <div>
                <Label>Select Products</Label>
                {products.map((product) => {
                  const selected = selectedProducts.find(sp => sp.product_id === product.id);
                  return (
                    <div key={product.id} className="flex items-center gap-2 py-2">
                      <Switch
                        checked={!!selected}
                        onCheckedChange={(checked) => {
                          if (checked) onProductAdd(product.id);
                          else onProductRemove(product.id);
                        }}
                      />
                      <span className="flex-1">{product.name} - KSh {product.price}</span>
                      {selected && (
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onProductQuantityChange(product.id, selected.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{selected.quantity}</span>
                          <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onProductQuantityChange(product.id, selected.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bundle Price</Label>
                  <Input
                    type="number"
                    value={formData.bundle_price}
                    onChange={(e) => onFormChange("bundle_price", e.target.value)}
                    placeholder="380"
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => onFormChange("display_order", parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => onFormChange("is_active", checked)}
                />
                <Label>Active</Label>
              </div>
              {selectedProducts.length > 0 && (
                <div className="p-4 bg-muted rounded">
                  <p>Original Total: KSh {calculateOriginalTotal().toFixed(2)}</p>
                  <p className="text-green-600 font-bold">Savings: KSh {calculateSavings().toFixed(2)}</p>
                </div>
              )}
              <Button onClick={onSave} className="w-full">
                {editingBundle ? "Update Bundle" : "Create Bundle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
