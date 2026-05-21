import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Pencil, Trash2, Minus } from "lucide-react";
import { Bundle } from "@/types/bundle";
import { Product } from "@/types/product";
import { useState } from "react";

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

  const calculateCostTotal = () => {
    return selectedProducts.reduce((total, sp) => {
      const product = products.find(p => p.id === sp.product_id);
      return total + (product ? (Number(product.costPrice) || 0) * sp.quantity : 0);
    }, 0);
  };

  const calculateProfit = () => {
    const bundlePrice = parseFloat(formData.bundle_price) || 0;
    return bundlePrice - calculateCostTotal();
  };

  const calculateMargin = () => {
    const bundlePrice = parseFloat(formData.bundle_price) || 0;
    return bundlePrice > 0 ? (calculateProfit() / bundlePrice) * 100 : 0;
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
                <BundleImagePicker
                  imagePreview={imagePreview}
                  bundleImageUrl={formData.image}
                  selectedProductIds={selectedProducts.map(sp => sp.product_id)}
                  products={products}
                  onUpload={onImageChange}
                  onSelectProductImage={(url) => {
                    onImageChange(null);
                    onFormChange("image", url);
                  }}
                  onAutoCollage={() => {
                    onImageChange(null);
                    onFormChange("image", "");
                  }}
                />
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
                <div className="p-4 bg-muted rounded text-sm space-y-1">
                  <div className="flex justify-between"><span>Original Total</span><span>KSh {calculateOriginalTotal().toFixed(0)}</span></div>
                  <div className="flex justify-between"><span>Bundle Price</span><span>KSh {(parseFloat(formData.bundle_price) || 0).toFixed(0)}</span></div>
                  <div className="flex justify-between text-green-600"><span>Customer Savings</span><span>KSh {calculateSavings().toFixed(0)}</span></div>
                  <div className="flex justify-between"><span>Total Cost</span><span>KSh {calculateCostTotal().toFixed(0)}</span></div>
                  <div className={`flex justify-between font-bold ${calculateProfit() >= 0 ? "text-green-700" : "text-destructive"}`}>
                    <span>Profit / Margin</span>
                    <span>KSh {calculateProfit().toFixed(0)} · {calculateMargin().toFixed(1)}%</span>
                  </div>
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

// ------- 3-mode image picker -------
interface BundleImagePickerProps {
  imagePreview: string;
  bundleImageUrl: string;
  selectedProductIds: string[];
  products: Product[];
  onUpload: (file: File | null) => void;
  onSelectProductImage: (url: string) => void;
  onAutoCollage: () => void;
}

const BundleImagePicker = ({
  imagePreview,
  bundleImageUrl,
  selectedProductIds,
  products,
  onUpload,
  onSelectProductImage,
  onAutoCollage,
}: BundleImagePickerProps) => {
  // Detect initial mode based on existing data
  const hasUploaded = !!imagePreview && imagePreview.startsWith("blob:");
  const isUrlFromProduct = !!bundleImageUrl && products.some(p => p.image === bundleImageUrl);
  const initialMode: "upload" | "pick" | "auto" = hasUploaded
    ? "upload"
    : isUrlFromProduct
      ? "pick"
      : bundleImageUrl
        ? "upload"
        : "auto";

  const [mode, setMode] = useState<"upload" | "pick" | "auto">(initialMode);
  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
  const displayUrl = imagePreview || bundleImageUrl;

  return (
    <div className="space-y-2">
      <RadioGroup
        value={mode}
        onValueChange={(v) => {
          const m = v as typeof mode;
          setMode(m);
          if (m === "auto") onAutoCollage();
        }}
        className="flex flex-wrap gap-3 text-sm"
      >
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="auto" id="bimg-auto" />
          <Label htmlFor="bimg-auto" className="cursor-pointer font-normal">Auto-collage from products</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="pick" id="bimg-pick" />
          <Label htmlFor="bimg-pick" className="cursor-pointer font-normal">Pick a product image</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <RadioGroupItem value="upload" id="bimg-upload" />
          <Label htmlFor="bimg-upload" className="cursor-pointer font-normal">Upload custom</Label>
        </div>
      </RadioGroup>

      {mode === "upload" && (
        <>
          <Input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0] || null)} />
          {displayUrl && (
            <img src={displayUrl} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded border" />
          )}
        </>
      )}

      {mode === "pick" && (
        <>
          {selectedProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add products to the bundle first, then pick one image.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {selectedProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProductImage(p.image)}
                  className={`border-2 rounded overflow-hidden aspect-square bg-white transition ${
                    bundleImageUrl === p.image ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                  title={p.name}
                >
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "auto" && (
        <p className="text-xs text-muted-foreground">
          A 2×2 collage of the included products' images will be shown automatically. No upload needed.
        </p>
      )}
    </div>
  );
};
