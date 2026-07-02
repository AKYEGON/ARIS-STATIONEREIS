import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PLite {
  id: string;
  name: string;
  image: string;
  price: number;
}

interface BogoRow {
  id: string;
  name: string;
  product_id: string;
  free_product_id: string | null;
  buy_quantity: number;
  get_quantity: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  display_order: number;
  product?: PLite;
  free_product?: PLite | null;
}

const emptyForm = {
  name: "",
  product_id: "",
  free_product_id: "__same__",
  buy_quantity: 2,
  get_quantity: 1,
  is_active: true,
  starts_at: "",
  ends_at: "",
  display_order: 0,
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 16);
};

export const BogoOffersTab = () => {
  const [offers, setOffers] = useState<BogoRow[]>([]);
  const [products, setProducts] = useState<PLite[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BogoRow | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [{ data: prodData }, { data: bogoData }] = await Promise.all([
      supabase.from("products").select("id, name, image, price").order("name"),
      supabase.from("bogo_offers").select("*").order("display_order", { ascending: false }),
    ]);
    const prodList = (prodData || []) as PLite[];
    setProducts(prodList);
    const byId = new Map(prodList.map((p) => [p.id, p]));
    setOffers(
      (bogoData || []).map((b: any) => ({
        ...b,
        product: byId.get(b.product_id),
        free_product: b.free_product_id ? byId.get(b.free_product_id) : null,
      })),
    );
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (o: BogoRow) => {
    setEditing(o);
    setForm({
      name: o.name,
      product_id: o.product_id,
      free_product_id: o.free_product_id || "__same__",
      buy_quantity: o.buy_quantity,
      get_quantity: o.get_quantity,
      is_active: o.is_active,
      starts_at: toLocalInput(o.starts_at),
      ends_at: toLocalInput(o.ends_at),
      display_order: o.display_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.product_id) return toast.error("Pick the product the customer must buy");
    if (form.buy_quantity < 1 || form.get_quantity < 1) return toast.error("Quantities must be 1 or more");

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      product_id: form.product_id,
      free_product_id: form.free_product_id === "__same__" ? null : form.free_product_id,
      buy_quantity: form.buy_quantity,
      get_quantity: form.get_quantity,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      display_order: form.display_order,
    };
    const { error } = editing
      ? await supabase.from("bogo_offers").update(payload).eq("id", editing.id)
      : await supabase.from("bogo_offers").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Offer updated" : "Offer created");
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this BOGO offer?")) return;
    const { error } = await supabase.from("bogo_offers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Offer deleted");
    fetchAll();
  };

  const toggleActive = async (o: BogoRow) => {
    const { error } = await supabase
      .from("bogo_offers")
      .update({ is_active: !o.is_active })
      .eq("id", o.id);
    if (error) return toast.error(error.message);
    fetchAll();
  };

  const isLive = (o: BogoRow) => {
    if (!o.is_active) return false;
    const now = Date.now();
    if (o.starts_at && new Date(o.starts_at).getTime() > now) return false;
    if (o.ends_at && new Date(o.ends_at).getTime() < now) return false;
    return true;
  };

  const buyProd = products.find((p) => p.id === form.product_id);
  const freeProd =
    form.free_product_id === "__same__"
      ? buyProd
      : products.find((p) => p.id === form.free_product_id);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-600" /> Buy X, Get Y Free Offers
          </CardTitle>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Offer
          </Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 pt-0">
          {offers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No BOGO offers yet. Create one to feature it on the Deals page.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer</TableHead>
                    <TableHead>Buy</TableHead>
                    <TableHead>Get Free</TableHead>
                    <TableHead className="hidden sm:table-cell">Window</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="p-2 sm:p-4">
                        <div className="font-medium text-xs sm:text-sm">{o.name}</div>
                        <div className="text-[10px] text-muted-foreground">order #{o.display_order}</div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                        {o.buy_quantity}× {o.product?.name || "-"}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                        {o.get_quantity}× {(o.free_product?.name) || o.product?.name || "(same)"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-[11px] text-muted-foreground">
                        {o.starts_at ? new Date(o.starts_at).toLocaleDateString() : "-"} →{" "}
                        {o.ends_at ? new Date(o.ends_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        {isLive(o) ? (
                          <Badge className="bg-emerald-600 text-[10px]">Live</Badge>
                        ) : o.is_active ? (
                          <Badge variant="secondary" className="text-[10px]">Scheduled</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Off</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right p-2 sm:p-4">
                        <div className="flex justify-end items-center gap-1">
                          <Switch checked={o.is_active} onCheckedChange={() => toggleActive(o)} />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(o)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(o.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit BOGO Offer" : "New BOGO Offer"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Internal name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Buy 2 Bic Pens, Get 1 Free"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Buy quantity</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.buy_quantity}
                  onChange={(e) => setForm({ ...form, buy_quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label className="text-xs">Get free</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.get_quantity}
                  onChange={(e) => setForm({ ...form, get_quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Product to buy</Label>
              <Select
                value={form.product_id}
                onValueChange={(v) => setForm({ ...form, product_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Pick product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Free product</Label>
              <Select
                value={form.free_product_id}
                onValueChange={(v) => setForm({ ...form, free_product_id: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__same__">Same as bought product</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Live preview of collage */}
            {buyProd && (
              <div>
                <Label className="text-xs">Preview</Label>
                <div className="mt-1 aspect-[2/1] max-h-40 rounded border bg-white overflow-hidden">
                  <div className="grid grid-cols-2 h-full">
                    <div className="flex items-center justify-center p-2">
                      <img src={buyProd.image} alt="" className="max-h-full object-contain" />
                    </div>
                    <div className="relative flex items-center justify-center p-2 bg-emerald-50">
                      <span className="absolute top-1 left-1 text-[10px] font-bold text-white bg-emerald-600 rounded px-1.5 py-0.5">FREE</span>
                      <img src={freeProd?.image} alt="" className="max-h-full object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Starts at (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Ends at (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Display order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label className="text-xs">Active</Label>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving…" : editing ? "Update Offer" : "Create Offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BogoOffersTab;
