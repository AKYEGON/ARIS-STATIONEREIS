import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export interface ProductVariant {
  id?: string;
  variant_type: string;
  variant_value: string;
  price: number;
  cost_price: number;
  stock: number;
  sku: string;
  is_active: boolean;
  display_order: number;
  isNew?: boolean; // for tracking unsaved variants
}

interface ProductVariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

const PRESET_TYPES = ["Size", "Color", "Pack Size"];

export const ProductVariantManager = ({ variants, onChange }: ProductVariantManagerProps) => {
  const [isExpanded, setIsExpanded] = useState(variants.length > 0);
  const [newVariant, setNewVariant] = useState<Partial<ProductVariant>>({
    variant_type: "",
    variant_value: "",
    price: 0,
    cost_price: 0,
    stock: 0,
    sku: "",
  });
  const [customType, setCustomType] = useState("");
  const [selectedPresetType, setSelectedPresetType] = useState("");

  const activeType = selectedPresetType === "__custom__" ? customType : selectedPresetType;

  const addVariant = () => {
    if (!activeType || !newVariant.variant_value || !newVariant.price) return;

    const variant: ProductVariant = {
      variant_type: activeType,
      variant_value: newVariant.variant_value || "",
      price: newVariant.price || 0,
      cost_price: newVariant.cost_price || 0,
      stock: newVariant.stock || 0,
      sku: newVariant.sku || "",
      is_active: true,
      display_order: variants.length,
      isNew: true,
    };

    onChange([...variants, variant]);
    setNewVariant({
      variant_type: "",
      variant_value: "",
      price: 0,
      cost_price: 0,
      stock: 0,
      sku: "",
    });
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // Group variants by type
  const groupedVariants = variants.reduce<Record<string, { variants: (ProductVariant & { origIndex: number })[] }>>((acc, v, i) => {
    if (!acc[v.variant_type]) acc[v.variant_type] = { variants: [] };
    acc[v.variant_type].variants.push({ ...v, origIndex: i });
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left text-sm font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Product Variations
        {variants.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {variants.length} variant{variants.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 pl-1">
          {/* Existing variants grouped by type */}
          {Object.entries(groupedVariants).map(([type, group]) => (
            <div key={type} className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{type}</p>
              {group.variants.map((v) => (
                <Card key={v.origIndex} className="border-border/50">
                  <CardContent className="p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{v.variant_value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeVariant(v.origIndex)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Price</Label>
                        <Input
                          type="number"
                          value={v.price}
                          onChange={(e) => updateVariant(v.origIndex, "price", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Cost</Label>
                        <Input
                          type="number"
                          value={v.cost_price}
                          onChange={(e) => updateVariant(v.origIndex, "cost_price", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Stock</Label>
                        <Input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariant(v.origIndex, "stock", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}

          {/* Add new variant */}
          <Card className="border-dashed border-primary/30">
            <CardContent className="p-3 space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground">Add Variant</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Type</Label>
                  <select
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={selectedPresetType}
                    onChange={(e) => setSelectedPresetType(e.target.value)}
                  >
                    <option value="">Select type...</option>
                    {PRESET_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__custom__">Custom...</option>
                  </select>
                </div>
                {selectedPresetType === "__custom__" && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Custom Type</Label>
                    <Input
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="e.g., Material"
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Value</Label>
                  <Input
                    value={newVariant.variant_value || ""}
                    onChange={(e) => setNewVariant({ ...newVariant, variant_value: e.target.value })}
                    placeholder="e.g., A4, Blue"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Price *</Label>
                  <Input
                    type="number"
                    value={newVariant.price || ""}
                    onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Cost</Label>
                  <Input
                    type="number"
                    value={newVariant.cost_price || ""}
                    onChange={(e) => setNewVariant({ ...newVariant, cost_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Stock</Label>
                  <Input
                    type="number"
                    value={newVariant.stock || ""}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={addVariant}
                disabled={!activeType || !newVariant.variant_value || !newVariant.price}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Variant
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
