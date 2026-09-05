import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { smartMatch } from "@/lib/smart-search";
import { formatPhoneForWhatsApp } from "@/types/communication";
import {
  Loader2,
  Minus,
  Package,
  Percent,
  Plus,
  Save,
  Search,
  ShoppingCart,
  Trash2,
  MessageCircle,
  Download,
} from "lucide-react";

export interface QuoteLine {
  product_id: string;
  variant_id: string | null;
  name: string;
  image: string | null;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  available: boolean;
}

interface SimpleVariant {
  id: string;
  variant_type: string;
  variant_value: string;
  price: number;
  cost_price: number | null;
  stock: number | null;
}

interface SimpleProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  price: number;
  cost_price: number | null;
  stock: number | null;
  variants: SimpleVariant[];
}

export interface QuoteSubmission {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  school_or_course: string | null;
  list_text: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  quote_items?: QuoteLine[] | null;
  quote_total?: number | null;
  quote_discount?: number | null;
  order_id?: string | null;
}

interface Props {
  submission: QuoteSubmission | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const lineKey = (l: QuoteLine) => `${l.product_id}_${l.variant_id || "base"}`;
const money = (n: number) => `KSh ${Math.round(n).toLocaleString()}`;

export const SchoolListQuoteDialog = ({ submission, open, onClose, onSaved }: Props) => {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [discount, setDiscount] = useState("0");
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [variantPicker, setVariantPicker] = useState<SimpleProduct | null>(null);

  useEffect(() => {
    if (!open) return;
    setLines((submission?.quote_items as QuoteLine[]) || []);
    setDiscount(String(submission?.quote_discount ?? 0));
    setSearch("");
  }, [open, submission?.id]);

  useEffect(() => {
    if (!open || products.length > 0) return;
    (async () => {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("products")
        .select("id,name,category,image,price,cost_price,stock,product_variants(id,variant_type,variant_value,price,cost_price,stock,is_active)")
        .order("name");
      if (error) {
        toast.error("Could not load products");
      } else {
        setProducts(
          (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            image: p.image,
            price: Number(p.price) || 0,
            cost_price: p.cost_price === null ? null : Number(p.cost_price),
            stock: p.stock,
            variants: (p.product_variants || [])
              .filter((v: any) => v.is_active !== false)
              .map((v: any) => ({
                id: v.id,
                variant_type: v.variant_type,
                variant_value: v.variant_value,
                price: Number(v.price) || 0,
                cost_price: v.cost_price === null ? null : Number(v.cost_price),
                stock: v.stock,
              })),
          })),
        );
      }
      setLoadingProducts(false);
    })();
  }, [open, products.length]);

  const filtered = useMemo(
    () =>
      search.trim()
        ? products.filter((p) => smartMatch(search, [p.name, p.category], { fuzzy: true })).slice(0, 40)
        : products.slice(0, 25),
    [products, search],
  );

  const addLine = (p: SimpleProduct, v?: SimpleVariant) => {
    if (p.variants.length > 0 && !v) {
      setVariantPicker(p);
      return;
    }
    const candidate: QuoteLine = {
      product_id: p.id,
      variant_id: v?.id ?? null,
      name: v ? `${p.name} (${v.variant_type}: ${v.variant_value})` : p.name,
      image: p.image,
      quantity: 1,
      unit_price: v ? v.price : p.price,
      unit_cost: (v ? v.cost_price : p.cost_price) ?? 0,
      available: true,
    };
    setLines((prev) => {
      const k = lineKey(candidate);
      const found = prev.find((l) => lineKey(l) === k);
      if (found) return prev.map((l) => (lineKey(l) === k ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, candidate];
    });
    setVariantPicker(null);
  };

  const patchLine = (k: string, patch: Partial<QuoteLine>) =>
    setLines((prev) => prev.map((l) => (lineKey(l) === k ? { ...l, ...patch } : l)));

  const removeLine = (k: string) => setLines((prev) => prev.filter((l) => lineKey(l) !== k));

  const addManualUnavailable = () => {
    const name = search.trim();
    if (!name) return toast.error("Type the item name in the search box first");
    setLines((prev) => [
      ...prev,
      {
        product_id: crypto.randomUUID(),
        variant_id: null,
        name,
        image: null,
        quantity: 1,
        unit_price: 0,
        unit_cost: 0,
        available: false,
      },
    ]);
    setSearch("");
  };

  const available = lines.filter((l) => l.available);
  const unavailable = lines.filter((l) => !l.available);
  const subtotal = available.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const discountAmount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = subtotal - discountAmount;

  const persist = async (extra: Record<string, any> = {}) => {
    if (!submission) return false;
    const { error } = await supabase
      .from("school_list_submissions")
      .update({
        quote_items: lines as any,
        quote_total: total,
        quote_discount: discountAmount,
        ...extra,
      })
      .eq("id", submission.id);
    if (error) {
      toast.error("Could not save the quote");
      return false;
    }
    onSaved();
    return true;
  };

  const saveDraft = async () => {
    setSaving(true);
    if (await persist({ status: submission?.status === "new" ? "reviewing" : submission?.status }))
      toast.success("Quote saved");
    setSaving(false);
  };

  const buildMessage = () => {
    if (!submission) return "";
    const lines2: string[] = [];
    lines2.push("*ARIS STATIONERIES*");
    lines2.push("");
    lines2.push(`Hi ${submission.customer_name}, here is the price for your list${submission.school_or_course ? ` (${submission.school_or_course})` : ""}.`);
    lines2.push("");
    lines2.push("*YOUR QUOTE*");
    available.forEach((l, i) => {
      lines2.push(`${i + 1}. ${l.name} x${l.quantity} - ${money(l.unit_price * l.quantity)}`);
    });
    if (discountAmount > 0) {
      lines2.push("");
      lines2.push(`Subtotal: ${money(subtotal)}`);
      lines2.push(`Discount: -${money(discountAmount)}`);
    }
    lines2.push("");
    lines2.push(`*TOTAL: ${money(total)}*`);
    if (unavailable.length) {
      lines2.push("");
      lines2.push("*NOT IN STOCK RIGHT NOW*");
      unavailable.forEach((l) => lines2.push(`- ${l.name}`));
      lines2.push("We can source these for you, just tell us.");
    }
    lines2.push("");
    lines2.push("Reply YES to confirm and we will pack it today.");
    return lines2.join("\n");
  };

  const sendQuote = async () => {
    if (!submission) return;
    if (available.length === 0) return toast.error("Add at least one priced item");
    setSaving(true);
    const ok = await persist({ status: "quoted", quoted_at: new Date().toISOString() });
    setSaving(false);
    if (!ok) return;
    window.open(
      `https://wa.me/${formatPhoneForWhatsApp(submission.customer_phone)}?text=${encodeURIComponent(buildMessage())}`,
      "_blank",
      "noopener",
    );
  };

  const convertToOrder = async () => {
    if (!submission) return;
    if (available.length === 0) return toast.error("Add at least one priced item");
    setConverting(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: submission.customer_name,
          customer_phone: submission.customer_phone,
          customer_email: submission.customer_email || "schoollist@store.local",
          delivery_address: submission.school_or_course || "In-store pickup",
          total,
          subtotal,
          original_total: subtotal,
          discount_amount: discountAmount,
          discount_type: discountAmount > 0 ? "fixed" : null,
          status: "Pending",
          tags: ["School List"],
        })
        .select()
        .single();
      if (orderError) throw orderError;

      let totalProfit = 0;
      for (const l of available) {
        const lineSubtotal = l.unit_price * l.quantity;
        const share = subtotal > 0 ? lineSubtotal / subtotal : 0;
        const lineRevenue = lineSubtotal - discountAmount * share;
        const profit = lineRevenue - l.unit_cost * l.quantity;
        totalProfit += profit;

        const { error: itemError } = await supabase.from("order_items").insert({
          order_id: order.id,
          product_name: l.name,
          product_image: l.image || "",
          quantity: l.quantity,
          price: l.unit_price,
          cost_price: l.unit_cost,
          profit,
        });
        if (itemError) throw itemError;

        const note = `School list order #${order.id.substring(0, 8)}`;
        if (l.variant_id) {
          const { error } = await supabase.rpc("adjust_variant_stock", {
            p_variant_id: l.variant_id,
            p_change: -l.quantity,
            p_reason: "sale",
            p_notes: note,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase.rpc("adjust_stock", {
            p_product_id: l.product_id,
            p_change: -l.quantity,
            p_reason: "sale",
            p_notes: note,
          });
          if (error) throw error;
        }
      }

      await supabase.from("orders").update({ profit: totalProfit }).eq("id", order.id);
      await persist({ status: "converted", order_id: order.id });
      toast.success(`Order created - ${money(total)}`);
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Could not create the order");
    } finally {
      setConverting(false);
    }
  };

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("school-lists").createSignedUrl(path, 300);
    if (error || !data) return toast.error("Could not open the file");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  if (!submission) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-[95vw] lg:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Quote for {submission.customer_name}
              <span className="text-xs font-normal text-muted-foreground">{submission.customer_phone}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-2 overflow-hidden flex-1">
            {/* Customer's list + product search */}
            <div className="flex flex-col gap-3 overflow-hidden">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Their list
                </p>
                {submission.list_text ? (
                  <pre className="text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap break-words max-h-40 overflow-auto font-mono">
                    {submission.list_text}
                  </pre>
                ) : (
                  <p className="text-xs text-muted-foreground">No typed list.</p>
                )}
                {submission.file_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs mt-2"
                    onClick={() => openFile(submission.file_url!)}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    {submission.file_name || "Attachment"}
                  </Button>
                )}
              </div>

              <Separator />

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>

              <ScrollArea className="flex-1 min-h-[180px] rounded border">
                <div className="p-1.5 space-y-1">
                  {loadingProducts && (
                    <p className="text-xs text-muted-foreground p-2">Loading products...</p>
                  )}
                  {!loadingProducts && filtered.length === 0 && (
                    <div className="p-2 space-y-2">
                      <p className="text-xs text-muted-foreground">No products match.</p>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addManualUnavailable}>
                        Add "{search}" as not in stock
                      </Button>
                    </div>
                  )}
                  {filtered.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addLine(p)}
                      className="w-full flex items-center gap-2 rounded p-1.5 text-left hover:bg-muted/60"
                    >
                      <img src={p.image} alt="" className="h-8 w-8 rounded object-cover bg-muted" />
                      <span className="flex-1 truncate text-xs">{p.name}</span>
                      {p.variants.length > 0 && (
                        <Badge variant="outline" className="text-[9px]">
                          {p.variants.length} options
                        </Badge>
                      )}
                      <span className="text-xs font-medium">{money(p.price)}</span>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Quote builder */}
            <div className="flex flex-col gap-3 overflow-hidden">
              <ScrollArea className="flex-1 min-h-[220px] rounded border">
                <div className="p-2 space-y-2">
                  {lines.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <Package className="h-7 w-7 mb-2 opacity-40" />
                      <p className="text-xs">Add products to build the quote</p>
                    </div>
                  )}
                  {lines.map((l) => {
                    const k = lineKey(l);
                    return (
                      <div key={k} className={`rounded border p-2 space-y-1.5 ${l.available ? "" : "opacity-70 border-dashed"}`}>
                        <div className="flex items-start gap-2">
                          <span className="flex-1 text-xs font-medium leading-snug">{l.name}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeLine(k)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => patchLine(k, { quantity: Math.max(1, l.quantity - 1) })}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs">{l.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-6 w-6"
                              onClick={() => patchLine(k, { quantity: l.quantity + 1 })}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Input
                            type="number"
                            value={l.unit_price}
                            onChange={(e) => patchLine(k, { unit_price: Number(e.target.value) || 0 })}
                            className="h-7 w-24 text-xs"
                            disabled={!l.available}
                          />
                          <Button
                            size="sm"
                            variant={l.available ? "ghost" : "secondary"}
                            className="h-7 text-[11px] ml-auto"
                            onClick={() => patchLine(k, { available: !l.available })}
                          >
                            {l.available ? "Mark not in stock" : "Not in stock"}
                          </Button>
                          {l.available && (
                            <span className="text-xs font-semibold">{money(l.unit_price * l.quantity)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="rounded border p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" /> Discount (KSh)
                  </span>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-7 w-28 text-xs"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={saveDraft} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Save draft
                </Button>
                <Button size="sm" className="text-xs" onClick={sendQuote} disabled={saving}>
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  Send on WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs ml-auto"
                  onClick={convertToOrder}
                  disabled={converting || !!submission.order_id}
                >
                  {converting && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                  {submission.order_id ? "Order created" : "Convert to order"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant picker */}
      <Dialog open={!!variantPicker} onOpenChange={(o) => !o && setVariantPicker(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Choose an option - {variantPicker?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 max-h-[50vh] overflow-auto">
            {variantPicker?.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => addLine(variantPicker, v)}
                className="w-full flex items-center gap-2 rounded border p-2 text-left text-xs hover:bg-muted/60"
              >
                <span className="flex-1">
                  {v.variant_type}: {v.variant_value}
                </span>
                <span className="text-muted-foreground">{v.stock ?? 0} in stock</span>
                <span className="font-medium">{money(v.price)}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchoolListQuoteDialog;
