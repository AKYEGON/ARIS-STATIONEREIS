import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Inbox, CheckCircle2, Clock, RefreshCw, Loader2 } from "lucide-react";
import { SendReviewRequestsModal } from "./SendReviewRequestsModal";
import { toast } from "sonner";

type RequestRow = {
  id: string;
  order_id: string;
  product_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  sent_at: string | null;
  submitted_at: string | null;
  created_at: string;
  product?: { name: string } | null;
};

type OrderGroup = {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  oldestSent: string | null;
  newestCreated: string;
  products: { product_name: string }[];
  rows: RequestRow[];
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function ReviewRequestFunnel() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [resendOrder, setResendOrder] = useState<{
    id: string;
    customer_name: string;
    customer_phone: string;
    order_items?: { product_name: string }[];
  } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("review_requests")
        .select("id, order_id, product_id, customer_name, customer_phone, status, sent_at, submitted_at, created_at, product:products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data || []) as any);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to load review requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const total = rows.length;
    const sent = rows.filter((r) => r.status === "sent" || r.status === "submitted").length;
    const submitted = rows.filter((r) => r.status === "submitted").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    return { total, sent, submitted, pending };
  }, [rows]);

  const conversionRate = counts.sent > 0 ? Math.round((counts.submitted / counts.sent) * 100) : 0;

  // Unanswered = sent but not submitted, sent >= 7 days ago
  const unansweredOrders: OrderGroup[] = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const unanswered = rows.filter(
      (r) => r.status === "sent" && r.sent_at && new Date(r.sent_at).getTime() <= cutoff
    );
    const byOrder = new Map<string, OrderGroup>();
    for (const r of unanswered) {
      const g = byOrder.get(r.order_id) || {
        order_id: r.order_id,
        customer_name: r.customer_name || "Customer",
        customer_phone: r.customer_phone || "",
        oldestSent: r.sent_at,
        newestCreated: r.created_at,
        products: [],
        rows: [],
      };
      g.products.push({ product_name: r.product?.name || "Product" });
      g.rows.push(r);
      if (r.sent_at && (!g.oldestSent || new Date(r.sent_at) < new Date(g.oldestSent))) {
        g.oldestSent = r.sent_at;
      }
      byOrder.set(r.order_id, g);
    }
    return Array.from(byOrder.values()).sort((a, b) =>
      (a.oldestSent || "").localeCompare(b.oldestSent || "")
    );
  }, [rows]);

  const handleResend = (g: OrderGroup) => {
    setResendOrder({
      id: g.order_id,
      customer_name: g.customer_name,
      customer_phone: g.customer_phone,
      order_items: g.products,
    });
  };

  const daysSince = (iso: string | null) => {
    if (!iso) return "-";
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
    return `${d}d ago`;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Review Request Funnel
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track how many review requests turn into reviews
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Funnel counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <FunnelStat icon={<Inbox className="h-4 w-4" />} label="Created" value={counts.total} color="bg-gray-100 text-gray-800" />
            <FunnelStat icon={<Send className="h-4 w-4" />} label="Sent" value={counts.sent} color="bg-blue-100 text-blue-800" />
            <FunnelStat icon={<Clock className="h-4 w-4" />} label="Pending" value={counts.pending} color="bg-yellow-100 text-yellow-800" />
            <FunnelStat icon={<CheckCircle2 className="h-4 w-4" />} label="Submitted" value={counts.submitted} color="bg-green-100 text-green-800" />
          </div>

          <div className="text-xs text-muted-foreground">
            Conversion (Sent → Submitted): <span className="font-semibold text-foreground">{conversionRate}%</span>
          </div>

          {/* Unanswered after 7d */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              Unanswered after 7+ days
              <Badge variant="secondary" className="text-[10px]">{unansweredOrders.length}</Badge>
            </h4>
            {loading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : unansweredOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">
                No outstanding requests older than 7 days. Nice work!
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unansweredOrders.map((g) => (
                  <div
                    key={g.order_id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded border bg-card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{g.customer_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {g.customer_phone} • Order #{g.order_id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {g.products.length} product{g.products.length === 1 ? "" : "s"} • last sent {daysSince(g.oldestSent)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResend(g)}
                      className="shrink-0"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Resend
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {resendOrder && (
        <SendReviewRequestsModal
          isOpen={!!resendOrder}
          onClose={() => {
            setResendOrder(null);
            load();
          }}
          order={resendOrder}
        />
      )}
    </>
  );
}

function FunnelStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
