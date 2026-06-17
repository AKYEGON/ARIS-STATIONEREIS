import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneForWhatsApp } from "@/types/communication";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    customer_name: string;
    customer_phone: string;
    order_items?: { product_name: string }[];
  };
}

interface RequestRow {
  product_id: string;
  product_name: string;
  token: string;
  status: string;
}

const SITE = "https://arisstationaries.co.ke";

export function SendReviewRequestsModal({ isOpen, onClose, order }: Props) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    void prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order.id]);

  const prepare = async () => {
    setLoading(true);
    try {
      // 1. Unique product names from this order
      const names = Array.from(
        new Set((order.order_items || []).map((i) => i.product_name).filter(Boolean))
      );
      if (names.length === 0) {
        toast.error("This order has no products to review.");
        setRows([]);
        return;
      }

      // 2. Match to product IDs
      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("id, name")
        .in("name", names);
      if (prodErr) throw prodErr;

      const productMap = new Map((products || []).map((p) => [p.name, p.id]));
      const missing = names.filter((n) => !productMap.has(n));
      if (missing.length) {
        console.warn("Products not matched:", missing);
      }

      // 3. Ensure a review_request row exists for each (order, product)
      const existing = await supabase
        .from("review_requests")
        .select("product_id, token, status")
        .eq("order_id", order.id);
      if (existing.error) throw existing.error;

      const existingByProduct = new Map(
        (existing.data || []).map((r) => [r.product_id, r])
      );

      const toCreate: { order_id: string; product_id: string; customer_name: string; customer_phone: string }[] = [];
      for (const name of names) {
        const pid = productMap.get(name);
        if (!pid) continue;
        if (!existingByProduct.has(pid)) {
          toCreate.push({
            order_id: order.id,
            product_id: pid,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
          });
        }
      }

      if (toCreate.length) {
        const { error: insErr } = await supabase.from("review_requests").insert(toCreate);
        if (insErr) throw insErr;
      }

      // 4. Re-read final set
      const { data: finalRows, error: finalErr } = await supabase
        .from("review_requests")
        .select("product_id, token, status")
        .eq("order_id", order.id);
      if (finalErr) throw finalErr;

      const enriched: RequestRow[] = (finalRows || []).map((r) => {
        const name = [...productMap.entries()].find(([, id]) => id === r.product_id)?.[0] || "Product";
        return { product_id: r.product_id, product_name: name, token: r.token, status: r.status };
      });

      setRows(enriched);
      setMessage(buildMessage(order.customer_name, enriched));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to prepare review requests");
    } finally {
      setLoading(false);
    }
  };

  const buildMessage = (name: string, items: RequestRow[]) => {
    const intro = `Hello ${name},\n\nThank you for shopping with ARIS STATIONERIES.\n\nWe'd love your honest feedback on the items from your recent order:\n`;
    const list = items
      .map((r, i) => `\n${i + 1}. ${r.product_name}\n${SITE}/review/${r.token}`)
      .join("");
    const outro = `\n\nReview any or all — even a quick rating helps fellow students choose with confidence.\n\nARIS STATIONERIES`;
    return intro + list + outro;
  };

  const markAsSent = async (channel: "whatsapp" | "sms") => {
    const pendingIds = rows.filter((r) => r.status !== "submitted").map((r) => r.product_id);
    if (pendingIds.length === 0) return;
    await supabase
      .from("review_requests")
      .update({ status: "sent", sent_at: new Date().toISOString(), sent_via: channel })
      .eq("order_id", order.id)
      .in("product_id", pendingIds);
  };

  const handleWhatsApp = async () => {
    const phone = formatPhoneForWhatsApp(order.customer_phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    await markAsSent("whatsapp");
    toast.success("Marked as sent via WhatsApp");
    onClose();
  };

  const handleCopySMS = async () => {
    await navigator.clipboard.writeText(message);
    await markAsSent("sms");
    toast.success("Message copied. Paste it into your SMS app.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Review Requests</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded p-3 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
              <p className="text-xs text-muted-foreground">
                {rows.length} product{rows.length === 1 ? "" : "s"} • Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {rows.length > 0 && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Message preview (editable)</label>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={12}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  {rows.map((r) => (
                    <div key={r.product_id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                      <span className="truncate flex-1">{r.product_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        r.status === "submitted" ? "bg-green-100 text-green-700"
                        : r.status === "sent" ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                      }`}>
                        {r.status === "submitted" && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopySMS} disabled={loading || rows.length === 0} className="flex-1">
            <Copy className="h-4 w-4 mr-1" />
            Copy for SMS
          </Button>
          <Button onClick={handleWhatsApp} disabled={loading || rows.length === 0} className="flex-1 bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-4 w-4 mr-1" />
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
