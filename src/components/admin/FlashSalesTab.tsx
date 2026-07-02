import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Zap, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PRow {
  id: string;
  name: string;
  image: string;
  price: number;
  original_price: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export const FlashSalesTab = () => {
  const [products, setProducts] = useState<PRow[]>([]);
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<PRow | null>(null);
  const [form, setForm] = useState({
    price: "",
    original_price: "",
    sale_starts_at: "",
    sale_ends_at: "",
  });

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,image,price,original_price,sale_starts_at,sale_ends_at")
      .order("name");
    if (error) {
      toast.error("Failed to load products");
      return;
    }
    setProducts((data as PRow[]) || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onSale = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.original_price && p.original_price > p.price) ||
          p.sale_starts_at ||
          p.sale_ends_at
      ),
    [products]
  );

  const pickable = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !onSale.find((o) => o.id === p.id))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice(0, 30);
  }, [products, onSale, search]);

  const openEdit = (p: PRow) => {
    setEditing(p);
    setForm({
      price: String(p.price),
      original_price: String(p.original_price ?? p.price),
      sale_starts_at: toLocalInput(p.sale_starts_at),
      sale_ends_at: toLocalInput(p.sale_ends_at),
    });
  };

  const startNew = (p: PRow) => {
    setPickerOpen(false);
    setEditing(p);
    setForm({
      price: String(p.price),
      original_price: String(p.original_price ?? p.price),
      sale_starts_at: "",
      sale_ends_at: "",
    });
  };

  const save = async () => {
    if (!editing) return;
    const price = parseFloat(form.price);
    const original = parseFloat(form.original_price);
    if (isNaN(price) || isNaN(original)) {
      toast.error("Enter valid prices");
      return;
    }
    if (original <= price) {
      toast.error("Original price must be higher than sale price");
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({
        price,
        original_price: original,
        sale_starts_at: fromLocalInput(form.sale_starts_at),
        sale_ends_at: fromLocalInput(form.sale_ends_at),
      })
      .eq("id", editing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Flash sale saved");
    setEditing(null);
    fetchProducts();
  };

  const clearSale = async (p: PRow) => {
    if (!confirm(`Remove flash sale on "${p.name}"?`)) return;
    const restorePrice = p.original_price && p.original_price > p.price ? p.original_price : p.price;
    const { error } = await supabase
      .from("products")
      .update({
        price: restorePrice,
        original_price: null,
        sale_starts_at: null,
        sale_ends_at: null,
      })
      .eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sale removed");
    fetchProducts();
  };

  const status = (p: PRow) => {
    const now = Date.now();
    const s = p.sale_starts_at ? new Date(p.sale_starts_at).getTime() : null;
    const e = p.sale_ends_at ? new Date(p.sale_ends_at).getTime() : null;
    if (s && now < s) return { label: "Scheduled", variant: "secondary" as const };
    if (e && now > e) return { label: "Ended", variant: "outline" as const };
    return { label: "Live", variant: "default" as const };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Zap className="h-4 w-4 text-primary" /> Flash Sales & Discounts
        </CardTitle>
        <Button size="sm" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Sale
        </Button>
      </CardHeader>
      <CardContent className="p-2 sm:p-6 pt-0">
        {onSale.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active flash sales. Click "Add Sale" to discount a product.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden sm:table-cell">Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onSale.map((p) => {
                  const st = status(p);
                  const pct =
                    p.original_price && p.original_price > 0
                      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
                      : 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-2">
                          <img src={p.image} alt={p.name} className="w-9 h-9 object-cover rounded" />
                          <div className="font-medium text-xs sm:text-sm line-clamp-1">{p.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                        <div className="font-medium">KSh {p.price.toFixed(0)}</div>
                        {p.original_price ? (
                          <div className="text-[10px] text-muted-foreground line-through">
                            KSh {p.original_price.toFixed(0)} {pct ? `(-${pct}%)` : ""}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-[11px] text-muted-foreground">
                        {p.sale_starts_at ? new Date(p.sale_starts_at).toLocaleString() : "-"}
                        <br />
                        {p.sale_ends_at ? new Date(p.sale_ends_at).toLocaleString() : "no end"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-7 w-7 text-destructive" onClick={() => clearSale(p)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Product picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick a product</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="space-y-1 mt-2">
            {pickable.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => startNew(p)}
                className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted text-left"
              >
                <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">KSh {p.price.toFixed(0)}</div>
                </div>
              </button>
            ))}
            {pickable.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No matches</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="line-clamp-1">{editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Original price (KSh)</Label>
                <Input
                  type="number"
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Sale price (KSh)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Starts (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.sale_starts_at}
                  onChange={(e) => setForm({ ...form, sale_starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Ends (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.sale_ends_at}
                  onChange={(e) => setForm({ ...form, sale_ends_at: e.target.value })}
                />
              </div>
            </div>
            {form.original_price && form.price && parseFloat(form.original_price) > parseFloat(form.price) && (
              <div className="rounded bg-muted p-2 text-xs">
                Customer saves{" "}
                <span className="font-semibold text-primary">
                  KSh {(parseFloat(form.original_price) - parseFloat(form.price)).toFixed(0)}
                </span>{" "}
                (
                {Math.round(
                  ((parseFloat(form.original_price) - parseFloat(form.price)) /
                    parseFloat(form.original_price)) *
                    100
                )}
                % off)
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
