import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, Package, Images } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Year {
  id: string;
  label: string;
}

interface CourseBundle {
  id: string;
  course_year_id: string;
  name: string;
  description: string | null;
  image: string;
  bundle_price: number;
  original_total_price: number;
  display_order: number;
  is_active: boolean;
}

interface ProductLite {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface BundleItem {
  id: string;
  product_id: string;
  quantity: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}

const blankForm = {
  name: "",
  description: "",
  image: "",
  bundle_price: 0,
  original_total_price: 0,
  display_order: 0,
  is_active: true,
  course_year_id: "",
};

export const CourseBundlesDialog = ({ open, onOpenChange, courseId, courseName }: Props) => {
  const [years, setYears] = useState<Year[]>([]);
  const [bundles, setBundles] = useState<CourseBundle[]>([]);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [editor, setEditor] = useState<{ bundle?: CourseBundle } | null>(null);
  const [form, setForm] = useState(blankForm);
  const [items, setItems] = useState<BundleItem[]>([]);
  const [productPicker, setProductPicker] = useState("");

  const load = async () => {
    const [{ data: yrs }, { data: bs }, { data: ps }] = await Promise.all([
      supabase.from("course_years").select("id, label").eq("course_id", courseId).order("display_order"),
      supabase.from("course_bundles").select("*").eq("course_id", courseId).order("display_order"),
      supabase.from("products").select("id, name, image, price").order("name"),
    ]);
    setYears((yrs as Year[]) || []);
    setBundles((bs as CourseBundle[]) || []);
    setProducts((ps as ProductLite[]) || []);
  };

  useEffect(() => {
    if (open && courseId) load();
  }, [open, courseId]);

  const openNew = () => {
    setEditor({});
    setForm({ ...blankForm, course_year_id: years[0]?.id || "" });
    setItems([]);
  };

  const openEdit = async (b: CourseBundle) => {
    setEditor({ bundle: b });
    setForm({
      name: b.name,
      description: b.description || "",
      image: b.image,
      bundle_price: Number(b.bundle_price),
      original_total_price: Number(b.original_total_price),
      display_order: b.display_order,
      is_active: b.is_active,
      course_year_id: b.course_year_id,
    });
    const { data } = await supabase
      .from("course_bundle_items")
      .select("id, product_id, quantity")
      .eq("course_bundle_id", b.id);
    setItems((data as BundleItem[]) || []);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    if (!form.course_year_id) return toast.error("Pick a year first (add years on the course)");
    // image is optional — empty means auto-collage from included products
    if (items.length === 0) return toast.error("Add at least one product to the bundle");

    const payload = {
      course_id: courseId,
      course_year_id: form.course_year_id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      image: form.image.trim(),
      bundle_price: form.bundle_price,
      original_total_price: form.original_total_price,
      display_order: form.display_order,
      is_active: form.is_active,
    };

    let bundleId = editor?.bundle?.id;
    if (bundleId) {
      const { error } = await supabase.from("course_bundles").update(payload).eq("id", bundleId);
      if (error) return toast.error(error.message);
      await supabase.from("course_bundle_items").delete().eq("course_bundle_id", bundleId);
    } else {
      const { data, error } = await supabase.from("course_bundles").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      bundleId = data!.id;
    }
    if (items.length) {
      const { error: itErr } = await supabase.from("course_bundle_items").insert(
        items.map((it) => ({
          course_bundle_id: bundleId!,
          product_id: it.product_id,
          quantity: it.quantity,
        }))
      );
      if (itErr) return toast.error(itErr.message);
    }
    toast.success(editor?.bundle ? "Bundle updated" : "Bundle created");
    setEditor(null);
    load();
  };

  const remove = async (b: CourseBundle) => {
    if (!confirm(`Delete bundle "${b.name}"?`)) return;
    await supabase.from("course_bundle_items").delete().eq("course_bundle_id", b.id);
    const { error } = await supabase.from("course_bundles").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleItem = (productId: string, checked: boolean) => {
    setItems((prev) =>
      checked
        ? [...prev, { id: crypto.randomUUID(), product_id: productId, quantity: 1 }]
        : prev.filter((it) => it.product_id !== productId)
    );
  };

  const setItemQty = (productId: string, qty: number) => {
    setItems((prev) => prev.map((it) => (it.product_id === productId ? { ...it, quantity: Math.max(1, qty) } : it)));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productPicker.toLowerCase())
  );

  // List view
  if (editor === null) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Course Bundles · {courseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {years.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                Add at least one year on this course first.
              </p>
            )}
            <Button size="sm" onClick={openNew} disabled={years.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> New Bundle
            </Button>
            {bundles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No course bundles yet.</p>
            ) : (
              <div className="space-y-2">
                {bundles.map((b) => {
                  const yearLabel = years.find((y) => y.id === b.course_year_id)?.label || "(year removed)";
                  return (
                    <div key={b.id} className="flex items-center gap-3 p-2 border rounded">
                      <img src={b.image} alt={b.name} className="h-12 w-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">{yearLabel}</Badge>
                          <span>Ksh {Number(b.bundle_price).toFixed(0)}</span>
                          {!b.is_active && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(b)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Editor view
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editor.bundle ? "Edit Bundle" : "New Bundle"} · {courseName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Year *</Label>
            <Select value={form.course_year_id} onValueChange={(v) => setForm({ ...form, course_year_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose year" /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Bundle Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Science Year 1 Kit" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><Images className="h-3.5 w-3.5" /> Bundle Image</Label>
            <CourseBundleImagePicker
              imageUrl={form.image}
              selectedProducts={products.filter((p) => items.some((it) => it.product_id === p.id))}
              onChange={(url) => setForm({ ...form, image: url })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Price *</Label>
              <Input type="number" value={form.bundle_price} onChange={(e) => setForm({ ...form, bundle_price: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Original Total</Label>
              <Input type="number" value={form.original_total_price} onChange={(e) => setForm({ ...form, original_total_price: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Order</Label>
              <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
          </div>

          <div className="border-t pt-3">
            <Label>Bundle Items ({items.length})</Label>
            <Input className="mt-2" placeholder="Search products..." value={productPicker} onChange={(e) => setProductPicker(e.target.value)} />
            <ScrollArea className="h-64 border rounded mt-2 p-2">
              {filteredProducts.map((p) => {
                const item = items.find((it) => it.product_id === p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                    <Checkbox checked={!!item} onCheckedChange={(v) => toggleItem(p.id, !!v)} />
                    <img src={p.image} alt={p.name} className="h-8 w-8 object-contain bg-muted rounded" />
                    <span className="flex-1 text-xs truncate">{p.name}</span>
                    {item && (
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => setItemQty(p.id, parseInt(e.target.value) || 1)}
                        className="h-7 w-16 text-xs"
                      />
                    )}
                  </label>
                );
              })}
            </ScrollArea>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditor(null)} className="flex-1">Back</Button>
            <Button onClick={save} className="flex-1">{editor.bundle ? "Save" : "Create"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
