import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Search, Wallet } from "lucide-react";
import SEO from "@/components/common/SEO";

type Row = {
  id: string;
  book_id: string;
  book_title: string;
  book_cover: string | null;
  pickup_date: string;
  customer_name: string;
  payment_type: "deposit" | "full";
  amount_paid: number;
  balance_due: number;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500",
  reserved: "bg-blue-500",
  balance_paid: "bg-purple-500",
  collected: "bg-green-600",
  delivered: "bg-green-600",
  released: "bg-gray-500",
  refunded: "bg-orange-500",
  cancelled: "bg-red-500",
};

const MyReservations = () => {
  const { getCartItemCount } = useCart();
  const [params, setParams] = useSearchParams();
  const initial = params.get("phone") || "";
  const [phone, setPhone] = useState(initial);
  const [rows, setRows] = useState<Row[]>([]);
  const [credit, setCredit] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = async (p: string) => {
    if (!p.trim()) return;
    setLoading(true);
    setSearched(true);
    const [res, bal] = await Promise.all([
      supabase.rpc("get_reservations_by_phone", { p_phone: p.trim() }),
      supabase.rpc("get_store_credit_balance", { p_phone: p.trim() }),
    ]);
    setRows((res.data as any) || []);
    setCredit(Number(bal.data) || 0);
    setLoading(false);
    setParams({ phone: p.trim() });
  };

  useEffect(() => {
    if (initial) lookup(initial);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="My Book Reservations | ARIS STATIONERIES" description="Look up your Book of the Week reservations and store credit balance." />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-20 max-w-3xl">
        <Link to="/books" className="text-sm text-muted-foreground hover:text-foreground">← Back to Books</Link>
        <h1 className="text-2xl font-bold mt-2 mb-4">My Reservations</h1>

        <Card className="mb-6">
          <CardContent className="p-4">
            <Label className="text-sm">Enter your phone to look up reservations</Label>
            <div className="flex gap-2 mt-1">
              <Input type="tel" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup(phone)} />
              <Button onClick={() => lookup(phone)} disabled={loading}><Search className="h-4 w-4 mr-1" />Find</Button>
            </div>
          </CardContent>
        </Card>

        {searched && credit > 0 && (
          <Card className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="h-6 w-6 text-green-700 dark:text-green-300" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Store credit balance</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">KSh {credit.toFixed(2)}</p>
              </div>
              <Link to="/"><Button size="sm" variant="outline">Shop & redeem</Button></Link>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Looking up…</p>
        ) : searched && rows.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2" />
            No reservations found for this phone.
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3 flex gap-3">
                  <div className="w-16 h-20 bg-muted rounded shrink-0 overflow-hidden">
                    {r.book_cover ? (
                      <img src={r.book_cover} alt="" className="w-full h-full object-cover" />
                    ) : <div className="flex items-center justify-center h-full"><BookOpen className="h-6 w-6 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-clamp-1">{r.book_title}</p>
                    <p className="text-xs text-muted-foreground">{r.customer_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-white text-[10px] ${STATUS_COLORS[r.status] || "bg-gray-400"}`}>{r.status.replace(/_/g, " ")}</Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">{r.payment_type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Paid <strong className="text-foreground">KSh {r.amount_paid}</strong>
                      {r.balance_due > 0 && <span className="text-orange-600"> · Balance KSh {r.balance_due}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Pickup {new Date(r.pickup_date).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyReservations;
