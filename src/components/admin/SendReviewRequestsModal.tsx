import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneForWhatsApp } from "@/types/communication";
import {
  prepareReviewRequests,
  buildReviewMessage,
  markReviewRequestsSent,
  type ReviewRequestRow,
} from "@/lib/review-requests";

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

export function SendReviewRequestsModal({ isOpen, onClose, order }: Props) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ReviewRequestRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    prepareReviewRequests(order)
      .then((r) => {
        if (cancelled) return;
        if (r.length === 0) {
          toast.error("This order has no products to review.");
        }
        setRows(r);
        setMessage(buildReviewMessage(order.customer_name, r));
      })
      .catch((err: any) => {
        console.error(err);
        toast.error(err?.message || "Failed to prepare review requests");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order.id]);

  const handleWhatsApp = async () => {
    const phone = formatPhoneForWhatsApp(order.customer_phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    await markReviewRequestsSent(order.id, "whatsapp");
    toast.success("Marked as sent via WhatsApp");
    onClose();
  };

  const handleCopySMS = async () => {
    await navigator.clipboard.writeText(message);
    await markReviewRequestsSent(order.id, "sms");
    toast.success("Message copied. Paste it into your SMS app.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resend Review Requests</DialogTitle>
          <p className="text-xs text-muted-foreground pt-1">
            Use this if the original Delivered / Picked Up message didn't go through, or for orders
            completed before the unified flow was in place.
          </p>
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
                  <label className="text-sm font-medium">Message preview (editable)</label>
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
