import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatPhoneForWhatsApp } from "@/types/communication";

type Reservation = {
  id: string;
  book_id: string;
  customer_name: string;
  customer_phone: string;
  payment_type: "deposit" | "full";
  amount_paid: number;
  balance_due: number;
  delivery_method: string | null;
  status: string;
};

type Book = {
  id: string;
  title: string;
  author: string;
  full_price: number;
  pickup_date: string;
};

const BOOK_TRIGGERS = [
  { value: "book_reserved", label: "Reservation Confirmed" },
  { value: "book_balance_reminder", label: "Balance Reminder" },
  { value: "book_ready_pickup", label: "Ready for Pickup" },
  { value: "book_out_for_delivery", label: "Out for Delivery" },
  { value: "book_refunded_credit", label: "Deposit Refunded as Credit" },
  { value: "book_closing_soon", label: "Week Closing Soon" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reservation: Reservation | null;
  book: Book | null;
}

export const BookWhatsAppModal = ({ open, onOpenChange, reservation, book }: Props) => {
  const [trigger, setTrigger] = useState("book_reserved");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [credit, setCredit] = useState(0);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("message_templates")
        .select("trigger_status, template")
        .eq("channel", "whatsapp")
        .eq("is_active", true)
        .like("trigger_status", "book_%");
      const map: Record<string, string> = {};
      (data || []).forEach((t: any) => { if (t.trigger_status) map[t.trigger_status] = t.template; });
      setTemplates(map);

      if (reservation) {
        const { data: c } = await supabase.rpc("get_store_credit_balance", { p_phone: reservation.customer_phone });
        setCredit(Number(c) || 0);
      }
    })();
  }, [open, reservation]);

  // pick a sensible default trigger based on status
  useEffect(() => {
    if (!reservation) return;
    const s = reservation.status;
    if (s === "released" || s === "refunded") setTrigger("book_refunded_credit");
    else if (s === "delivered") setTrigger("book_out_for_delivery");
    else if (s === "collected") setTrigger("book_ready_pickup");
    else if (s === "balance_paid") setTrigger("book_ready_pickup");
    else setTrigger("book_reserved");
  }, [reservation]);

  // re-render message when trigger / templates / credit changes
  useEffect(() => {
    if (!reservation || !book) return;
    const tpl = templates[trigger] || "";
    const filled = tpl
      .replace(/{customer_name}/g, reservation.customer_name)
      .replace(/{book_title}/g, book.title)
      .replace(/{book_author}/g, book.author)
      .replace(/{full_price}/g, book.full_price.toLocaleString())
      .replace(/{pickup_date}/g, new Date(book.pickup_date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "short" }))
      .replace(/{amount_paid}/g, reservation.amount_paid.toLocaleString())
      .replace(/{balance_due}/g, reservation.balance_due.toLocaleString())
      .replace(/{delivery_method}/g, reservation.delivery_method || "Pickup")
      .replace(/{store_credit_amount}/g, credit.toLocaleString())
      .replace(/{reservation_id_short}/g, reservation.id.slice(0, 8).toUpperCase());
    setMessage(filled);
  }, [trigger, templates, reservation, book, credit]);

  const sendWhatsApp = async () => {
    if (!reservation || !message.trim()) return;
    const phone = formatPhoneForWhatsApp(reservation.customer_phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    // best-effort log (book_reservations isn't tied to order_communications; just toast)
    toast({ title: "WhatsApp opened", description: "Message draft ready to send." });
    onOpenChange(false);
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>WhatsApp - {reservation.customer_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            To: {reservation.customer_phone} • Book: {book?.title || "—"} • Credit on file: KSh {credit.toLocaleString()}
          </div>
          <div>
            <Label>Template</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOOK_TRIGGERS.map((t) => (
                  <SelectItem key={t.value} value={t.value} disabled={!templates[t.value]}>
                    {t.label}{!templates[t.value] && " (not set)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Message (editable)</Label>
            <Textarea rows={10} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={sendWhatsApp} className="bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4 mr-1" />Open WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookWhatsAppModal;
