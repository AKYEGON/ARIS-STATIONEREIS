import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";
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
      deliveryMethod === "pickup" ? { outlet: pickupOutlet } : { university };
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
    toast({ title: "Slot reserved", description: "We will contact you on WhatsApp to confirm payment." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafaf9]">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-12 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5"><Skeleton className="aspect-[3/4] rounded-lg" /></div>
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafaf9]">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <p className="font-serif text-2xl font-bold mb-3">Book not found</p>
          <Link to="/books" className="text-primary font-semibold inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to the shelf
          </Link>
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
  const pct = Math.min(100, (book.slots_reserved / book.slots_total) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <SEO
        title={`${book.title} by ${book.author} | Book of the Week | ARIS STATIONERIES`}
        description={
          book.synopsis ||
          `Reserve ${book.title} from ARIS Book of the Week. Pay KSh ${book.deposit_amount} deposit to lock your slot.`
        }
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 pb-20">
        <Link
          to="/books"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-primary mb-6 md:mb-10 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2" /> The Shelf
        </Link>

        <article className="grid lg:grid-cols-12 gap-8 md:gap-12">
          {/* Cover */}
          <div className="lg:col-span-5">
            <div className="relative group lg:sticky lg:top-24">
              <div className="absolute -inset-3 md:-inset-4 bg-primary/5 rounded-2xl rotate-1 group-hover:rotate-0 transition-transform duration-700" />
              <div className="relative aspect-[3/4] bg-stone-200 rounded-lg overflow-hidden shadow-2xl max-w-sm mx-auto lg:max-w-none">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={`${book.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-16 w-16 text-stone-400" />
                  </div>
                )}
                <div className="absolute bottom-5 left-5 bg-stone-900/90 backdrop-blur px-4 py-2 text-white text-[10px] font-bold tracking-widest uppercase">
                  This Week's Pick
                </div>
              </div>
            </div>
          </div>

          {/* Editorial + reserve */}
          <div className="lg:col-span-7 space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {book.book_genres?.name && (
                  <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-[11px] font-bold uppercase tracking-wider italic">
                    {book.book_genres.name}
                  </span>
                )}
                {!closed && !soldOut && left <= 10 && (
                  <span className="inline-block px-3 py-1 bg-red-50 text-red-700 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    Only {left} left
                  </span>
                )}
                {soldOut && (
                  <span className="inline-block px-3 py-1 bg-stone-800 text-white rounded-full text-[11px] font-bold uppercase tracking-wider">
                    Sold out
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 leading-tight">
                {book.title}
              </h1>
              <p className="text-xl text-stone-500 italic font-serif">by {book.author}</p>
            </header>

            {/* Synopsis — editorial pull */}
            {book.synopsis && (
              <section className="border-l-2 border-primary pl-5 md:pl-6">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">
                  The Synopsis
                </p>
                <p className="text-stone-700 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {book.synopsis}
                </p>
              </section>
            )}

            {/* Logistics strip */}
            <section className="grid grid-cols-3 gap-4 py-5 border-y border-stone-200">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Closes
                </p>
                <div className="text-sm font-semibold text-stone-800">
                  <CountdownTimer endsAt={book.week_ends_at} compact />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Handover
                </p>
                <p className="text-sm font-semibold text-stone-800">
                  {new Date(book.pickup_date).toLocaleDateString("en-KE", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Slots
                </p>
                <p className="text-sm font-semibold text-stone-800">
                  {book.slots_reserved}/{book.slots_total}
                </p>
                <div className="h-1 bg-stone-100 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </section>

            {/* Reservation */}
            {success ? (
              <section className="bg-white border border-primary/30 rounded-2xl p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                  <p className="font-serif text-xl font-bold">Slot reserved</p>
                </div>
                <p className="text-sm text-stone-600">
                  Reservation ID: <code className="text-xs bg-stone-100 px-2 py-0.5 rounded">{success.slice(0, 8)}</code>
                </p>
                <p className="text-sm text-stone-600">
                  We will send an M-Pesa prompt to <strong className="text-stone-900">{phone}</strong> for KSh{" "}
                  {amount.toLocaleString()}.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <Link
                    to={`/books/my-reservations?phone=${encodeURIComponent(phone)}`}
                    className="flex-1"
                  >
                    <button className="w-full border-2 border-stone-200 hover:border-stone-300 text-stone-700 font-bold py-3 rounded-xl text-xs uppercase tracking-[0.2em] transition-colors">
                      My Reservations
                    </button>
                  </Link>
                  <Link to="/books" className="flex-1">
                    <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl text-xs uppercase tracking-[0.2em]">
                      Back to the Shelf
                    </button>
                  </Link>
                </div>
              </section>
            ) : closed || soldOut ? (
              <section className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
                <p className="font-serif text-xl font-bold text-stone-900 mb-1">
                  {soldOut ? "All slots taken" : "Reservations closed"}
                </p>
                <p className="text-sm text-stone-500">
                  New picks every Thursday. Pop back then for fresh reading.
                </p>
              </section>
            ) : (
              <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Payment choice */}
                <div className="p-6 md:p-8 bg-stone-50 border-b border-stone-200">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-5">
                    Choose Your Reservation
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentType("deposit")}
                      className={`text-left relative flex flex-col p-5 border-2 rounded-xl transition-all ${
                        paymentType === "deposit"
                          ? "border-primary bg-primary/5"
                          : "border-stone-200 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Secure Deposit
                      </span>
                      <span className="text-2xl font-bold text-stone-900">
                        KSh {book.deposit_amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-stone-500 mt-1">
                        Balance KSh {(book.full_price - book.deposit_amount).toLocaleString()} on handover
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType("full")}
                      className={`text-left relative flex flex-col p-5 border-2 rounded-xl transition-all ${
                        paymentType === "full"
                          ? "border-primary bg-primary/5"
                          : "border-stone-200 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                        Full Purchase
                      </span>
                      <span className="text-2xl font-bold text-stone-900">
                        KSh {book.full_price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-stone-500 mt-1">Priority handover</span>
                    </button>
                  </div>
                </div>

                {/* Customer details */}
                <div className="p-6 md:p-8 space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Your Name
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Wanjiku"
                        className="bg-stone-50 border-stone-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Phone (M-Pesa)
                      </Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        className="bg-stone-50 border-stone-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Email (optional)
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-stone-50 border-stone-200"
                    />
                  </div>

                  {/* Delivery */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      Handover Method
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("pickup")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          deliveryMethod === "pickup"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-stone-200 text-stone-600 hover:border-primary/30"
                        }`}
                      >
                        <MapPin className="w-4 h-4" /> Outlet
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("university")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          deliveryMethod === "university"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-stone-200 text-stone-600 hover:border-primary/30"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" /> University
                      </button>
                    </div>
                  </div>

                  {deliveryMethod === "pickup" ? (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Collection Point
                      </Label>
                      <Select value={pickupOutlet} onValueChange={setPickupOutlet}>
                        <SelectTrigger className="bg-stone-50 border-stone-200">
                          <SelectValue placeholder="Choose outlet" />
                        </SelectTrigger>
                        <SelectContent>
                          {outlets.map((o) => (
                            <SelectItem key={o.id} value={o.name}>
                              {o.name}
                              {o.location ? ` — ${o.location}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        University
                      </Label>
                      <Select value={university} onValueChange={setUniversity}>
                        <SelectTrigger className="bg-stone-50 border-stone-200">
                          <SelectValue placeholder="Choose university" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map((u) => (
                            <SelectItem key={u.id} value={u.name}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Total summary */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        You pay now
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        KSh {amount.toLocaleString()}
                      </span>
                    </div>
                    {balance > 0 && (
                      <div className="flex justify-between text-xs text-stone-500">
                        <span>Balance on handover day</span>
                        <span className="font-semibold">KSh {balance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={reserve}
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2"
                  >
                    {submitting ? "Reserving…" : `Confirm Reservation`}
                    {!submitting && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <p className="text-center text-[10px] text-stone-400 font-medium leading-relaxed">
                    By reserving, you agree that an unclaimed deposit becomes store credit usable on any product.
                  </p>
                </div>
              </section>
            )}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BookDetail;
