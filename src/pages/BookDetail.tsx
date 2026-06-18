import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, Clock, Users, CheckCircle2 } from "lucide-react";
import CountdownTimer from "@/components/products/CountdownTimer";
import SEO from "@/components/common/SEO";
import { toast } from "@/hooks/use-toast";

type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  synopsis: string | null;
  slug: string | null;
  full_price: number;
  deposit_amount: number;
  slots_total: number;
  slots_reserved: number;
  week_ends_at: string;
  pickup_date: string;
  status: string;
  book_genres?: { name: string } | null;
};

const BookDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<{ id: string; name: string; location: string | null }[]>([]);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);

  // form
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "university">("pickup");
  const [pickupOutlet, setPickupOutlet] = useState("");
  const [university, setUniversity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("books")
        .select("*, book_genres(name)")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      setBook((data as any) || null);
      setLoading(false);

      const [o, u] = await Promise.all([
        supabase.from("pickup_outlets").select("id, name, location").eq("is_active", true).order("display_order"),
        supabase.from("universities").select("id, name").eq("is_active", true).order("display_order"),
      ]);
      if (o.data) setOutlets(o.data);
      if (u.data) setUniversities(u.data);
    })();
  }, [slug]);

  const reserve = async () => {
    if (!book) return;
    if (!name.trim() || !phone.trim()) {
      return toast({ title: "Name and phone are required", variant: "destructive" });
    }
    if (deliveryMethod === "pickup" && !pickupOutlet) {
      return toast({ title: "Select a pickup outlet", variant: "destructive" });
    }
    if (deliveryMethod === "university" && !university) {
      return toast({ title: "Select a university", variant: "destructive" });
    }

    setSubmitting(true);
    const delivery_details =
      deliveryMethod === "pickup"
        ? { outlet: pickupOutlet }
        : { university };
    const { data, error } = await supabase.rpc("reserve_book_slot", {
      p_book_id: book.id,
      p_customer_name: name.trim(),
      p_customer_phone: phone.trim(),
      p_customer_email: email.trim() || null,
      p_payment_type: paymentType,
      p_delivery_method: deliveryMethod,
      p_delivery_details: delivery_details,
    });
    setSubmitting(false);

    if (error) {
      return toast({ title: "Reservation failed", description: error.message, variant: "destructive" });
    }
    const reservationId = (data as any)?.id;
    setSuccess(reservationId);
    toast({ title: "Slot reserved!", description: "We'll contact you on WhatsApp to confirm payment." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container py-12 text-center text-muted-foreground">Loading…</main>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container py-12 text-center">
          <p className="text-lg font-semibold mb-2">Book not found</p>
          <Link to="/books"><Button>Back to Books</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const left = book.slots_total - book.slots_reserved;
  const soldOut = left <= 0;
  const closed = book.status !== "open";
  const amount = paymentType === "deposit" ? book.deposit_amount : book.full_price;
  const balance = paymentType === "deposit" ? book.full_price - book.deposit_amount : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${book.title} by ${book.author} | Book of the Week | ARIS STATIONERIES`}
        description={book.synopsis || `Reserve ${book.title} from ARIS Book of the Week. Pay KSh ${book.deposit_amount} deposit to lock your slot.`}
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-20">
        <Link to="/books" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> All books
        </Link>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Cover */}
          <div>
            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden max-w-sm mx-auto">
              {book.cover_url ? (
                <img src={book.cover_url} alt={`${book.title} cover`} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full"><BookOpen className="h-16 w-16 text-muted-foreground" /></div>
              )}
            </div>
          </div>

          {/* Info + reserve */}
          <div className="space-y-4">
            <div>
              {book.book_genres?.name && <Badge className="mb-2">{book.book_genres.name}</Badge>}
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-muted-foreground">by {book.author}</p>
            </div>

            {book.synopsis && <p className="text-sm leading-relaxed">{book.synopsis}</p>}

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Full price</span>
                  <span className="font-bold">KSh {book.full_price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reserve with deposit</span>
                  <span className="font-bold text-primary">KSh {book.deposit_amount}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {book.slots_reserved}/{book.slots_total} reserved</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> <CountdownTimer endsAt={book.week_ends_at} compact /></span>
                </div>
                <div className="text-xs text-muted-foreground">
                  📅 Pickup / handover: <strong className="text-foreground">{new Date(book.pickup_date).toLocaleDateString("en-KE", { weekday: "long", month: "short", day: "numeric" })}</strong>
                </div>
              </CardContent>
            </Card>

            {success ? (
              <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-bold">Slot reserved!</p>
                  </div>
                  <p className="text-sm">Your reservation ID: <code className="text-xs">{success.slice(0, 8)}</code></p>
                  <p className="text-sm">We'll send an M-Pesa STK push to <strong>{phone}</strong> to collect KSh {amount}. Watch for the prompt.</p>
                  <div className="flex gap-2 pt-2">
                    <Link to={`/books/my-reservations?phone=${encodeURIComponent(phone)}`} className="flex-1"><Button variant="outline" className="w-full">My reservations</Button></Link>
                    <Link to="/books" className="flex-1"><Button className="w-full">Reserve another</Button></Link>
                  </div>
                </CardContent>
              </Card>
            ) : closed || soldOut ? (
              <Card><CardContent className="p-4 text-center">
                <p className="font-semibold">{soldOut ? "All slots taken" : "Reservations closed"}</p>
                <p className="text-sm text-muted-foreground mt-1">Check back next Thursday for new picks.</p>
              </CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold">Reserve your slot</h3>

                  <div>
                    <Label className="text-sm">Pay</Label>
                    <RadioGroup value={paymentType} onValueChange={(v: any) => setPaymentType(v)} className="grid grid-cols-2 gap-2 mt-1">
                      <label className={`flex flex-col gap-0.5 border rounded-md p-3 cursor-pointer ${paymentType === "deposit" ? "border-primary bg-primary/5" : ""}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="deposit" id="dep" />
                          <span className="font-semibold text-sm">Deposit</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">KSh {book.deposit_amount} now · {book.full_price - book.deposit_amount} on Thu</span>
                      </label>
                      <label className={`flex flex-col gap-0.5 border rounded-md p-3 cursor-pointer ${paymentType === "full" ? "border-primary bg-primary/5" : ""}`}>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="full" id="full" />
                          <span className="font-semibold text-sm">Full</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">KSh {book.full_price} now</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><Label className="text-sm">Your name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div><Label className="text-sm">Phone (M-Pesa) *</Label><Input type="tel" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                  </div>
                  <div><Label className="text-sm">Email (optional)</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>

                  <div>
                    <Label className="text-sm">Delivery method</Label>
                    <RadioGroup value={deliveryMethod} onValueChange={(v: any) => setDeliveryMethod(v)} className="grid grid-cols-2 gap-2 mt-1">
                      <label className={`flex items-center gap-2 border rounded-md p-2.5 cursor-pointer text-sm ${deliveryMethod === "pickup" ? "border-primary bg-primary/5" : ""}`}>
                        <RadioGroupItem value="pickup" /> Pick up at outlet
                      </label>
                      <label className={`flex items-center gap-2 border rounded-md p-2.5 cursor-pointer text-sm ${deliveryMethod === "university" ? "border-primary bg-primary/5" : ""}`}>
                        <RadioGroupItem value="university" /> University delivery
                      </label>
                    </RadioGroup>
                  </div>

                  {deliveryMethod === "pickup" ? (
                    <div>
                      <Label className="text-sm">Pickup outlet</Label>
                      <Select value={pickupOutlet} onValueChange={setPickupOutlet}>
                        <SelectTrigger><SelectValue placeholder="Choose outlet" /></SelectTrigger>
                        <SelectContent>
                          {outlets.map((o) => <SelectItem key={o.id} value={o.name}>{o.name}{o.location ? ` — ${o.location}` : ""}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm">University</Label>
                      <Select value={university} onValueChange={setUniversity}>
                        <SelectTrigger><SelectValue placeholder="Choose university" /></SelectTrigger>
                        <SelectContent>
                          {universities.map((u) => <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-md p-3 text-sm">
                    <div className="flex justify-between"><span>You pay now</span><strong className="text-primary">KSh {amount}</strong></div>
                    {balance > 0 && <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Balance on Thursday</span><span>KSh {balance}</span></div>}
                  </div>

                  <Button className="w-full" disabled={submitting} onClick={reserve}>
                    {submitting ? "Reserving…" : `Reserve slot · KSh ${amount}`}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    By reserving, you agree that an unclaimed deposit becomes store credit usable on any product.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookDetail;
