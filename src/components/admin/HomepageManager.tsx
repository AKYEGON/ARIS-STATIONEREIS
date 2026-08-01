import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Image as ImageIcon, Pin, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Slide {
  id: string;
  image_url: string;
  headline: string | null;
  subheadline: string | null;
  caption: string | null;
  cta_label: string | null;
  cta_link: string | null;
  display_order: number;
  is_active: boolean;
}

const emptySlide = {
  image_url: "",
  headline: "",
  subheadline: "",
  caption: "",
  cta_label: "",
  cta_link: "",
  display_order: 0,
  is_active: true,
};

export const HomepageManager = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [picks, setPicks] = useState<any[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ ...emptySlide });
  const [editing, setEditing] = useState<Slide | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickProduct, setPickProduct] = useState("");
  const [pickKind, setPickKind] = useState<"pin" | "exclude">("pin");

  const load = async () => {
    const [s, p, pr] = await Promise.all([
      supabase.from("hero_slides").select("*").order("display_order"),
      supabase.from("homepage_picks").select("*, product:products(id,name,image)").order("display_order"),
      supabase.from("products").select("id,name").order("name").limit(500),
    ]);
    setSlides((s.data || []) as Slide[]);
    setPicks(p.data || []);
    setProducts((pr.data || []) as any);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `hero/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error("Upload failed");
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    }
    setUploading(false);
  };

  const saveSlide = async () => {
    if (!form.image_url.trim()) {
      toast.error("A hero image is required");
      return;
    }
    const payload = {
      image_url: form.image_url.trim(),
      headline: form.headline.trim() || null,
      subheadline: form.subheadline.trim() || null,
      caption: form.caption.trim() || null,
      cta_label: form.cta_label.trim() || null,
      cta_link: form.cta_link.trim() || null,
      display_order: form.display_order,
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from("hero_slides").update(payload).eq("id", editing.id)
      : await supabase.from("hero_slides").insert(payload);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Slide updated" : "Slide added");
    setOpen(false);
    setEditing(null);
    setForm({ ...emptySlide });
    load();
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Delete this hero slide?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Slide deleted");
      load();
    }
  };

  const toggleSlide = async (s: Slide) => {
    await supabase.from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  };

  const addPick = async () => {
    if (!pickProduct) return;
    const { error } = await supabase
      .from("homepage_picks")
      .insert({ product_id: pickProduct, kind: pickKind, display_order: picks.length });
    if (error) toast.error(error.message);
    else {
      toast.success(pickKind === "pin" ? "Product pinned" : "Product hidden from homepage");
      setPickProduct("");
      load();
    }
  };

  const removePick = async (id: string) => {
    await supabase.from("homepage_picks").delete().eq("id", id);
    load();
  };

  const openEdit = (s: Slide) => {
    setEditing(s);
    setForm({
      image_url: s.image_url,
      headline: s.headline || "",
      subheadline: s.subheadline || "",
      caption: s.caption || "",
      cta_label: s.cta_label || "",
      cta_link: s.cta_link || "",
      display_order: s.display_order,
      is_active: s.is_active,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Hero slides
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {slides.length} slides. Leave headline blank to use the default ARIS copy.
            </p>
          </div>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) {
                setEditing(null);
                setForm({ ...emptySlide });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit slide" : "Add slide"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Image *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                  <Input
                    className="mt-2"
                    placeholder="or paste an image URL"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  />
                  {form.image_url && (
                    <img src={form.image_url} alt="" className="mt-2 h-32 w-full rounded object-cover" />
                  )}
                </div>
                <div>
                  <Label>Headline</Label>
                  <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                </div>
                <div>
                  <Label>Subheadline</Label>
                  <Textarea
                    rows={2}
                    value={form.subheadline}
                    onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Image caption (alt text)</Label>
                  <Input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Button label</Label>
                    <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
                  </div>
                  <div>
                    <Label>Button link</Label>
                    <Input
                      placeholder="/shop"
                      value={form.cta_link}
                      onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 items-end gap-3">
                  <div>
                    <Label>Order</Label>
                    <Input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label className="text-xs">Active</Label>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={saveSlide} disabled={uploading}>
                  {editing ? "Save changes" : "Add slide"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {slides.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No slides yet. The homepage is showing the default ARIS hero.
            </p>
          )}
          {slides.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border p-2">
              <img src={s.image_url} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.headline || "Default headline"}</p>
                <p className="truncate text-xs text-muted-foreground">{s.subheadline || "Default subheadline"}</p>
              </div>
              <Badge variant={s.is_active ? "default" : "secondary"} className="text-[10px]">
                {s.is_active ? "Live" : "Off"}
              </Badge>
              <Switch checked={s.is_active} onCheckedChange={() => toggleSlide(s)} />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => deleteSlide(s.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Popular right now
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            The strip ranks by real sales over the last 30 days. Pin a product to force it to the front, or hide one
            you do not want on the homepage.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              value={pickProduct}
              onChange={(e) => setPickProduct(e.target.value)}
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={pickKind}
              onChange={(e) => setPickKind(e.target.value as "pin" | "exclude")}
            >
              <option value="pin">Pin to front</option>
              <option value="exclude">Hide from homepage</option>
            </select>
            <Button onClick={addPick} disabled={!pickProduct}>
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {picks.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No overrides. The strip is purely sales-driven.
              </p>
            )}
            {picks.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2">
                {p.product?.image && (
                  <img src={p.product.image} alt="" className="h-10 w-10 rounded object-contain" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm">{p.product?.name || "Unknown product"}</span>
                <Badge variant={p.kind === "pin" ? "default" : "secondary"} className="gap-1 text-[10px]">
                  {p.kind === "pin" ? <Pin className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {p.kind === "pin" ? "Pinned" : "Hidden"}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removePick(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomepageManager;
