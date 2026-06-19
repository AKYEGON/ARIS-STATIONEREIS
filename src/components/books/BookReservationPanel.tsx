import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle2, MapPin, Bike } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export type BookForPanel = {
  id: string;
  full_price: number;
  deposit_amount: number;
  status: string;
  slots_total: number;
  slots_reserved: number;
};

type Outlet = { id: string; name: string; location: string | null };
type University = { id: string; name: string; branches: { id: string; name: string }[] };
type Zone = { id: string; name: string };

interface Props {
  book: BookForPanel;
  /** Notified once a reservation succeeds (mobile drawer uses this to know to surface success). */
  onReserved?: (reservationId: string) => void;
  /** Compact paddings, used when rendered inside a mobile drawer. */
  compact?: boolean;
}

export default function BookReservationPanel({ book, onReserved, compact = false }: Props) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [agentZones, setAgentZones] = useState<Zone[]>([]);

  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [pickupOutlet, setPickupOutlet] = useState("");
  const [university, setUniversity] = useState("");
  const [campusBranch, setCampusBranch] = useState("");
  const [agentZone, setAgentZone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [o, u, z] = await Promise.all([
        supabase.from("pickup_outlets").select("id, name, location").eq("is_active", true).order("display_order"),
        supabase
          .from("universities")
          .select("id, name, campus_branches(id, name, is_active, display_order)")
          .eq("is_active", true)
          .order("display_order"),
        supabase.from("agent_zones").select("id, name").eq("is_active", true).order("display_order"),
      ]);
      if (o.data) setOutlets(o.data);
      if (z.data) setAgentZones(z.data);
      if (u.data) {
        setUniversities(
          (u.data as any[]).map((uni) => ({
            id: uni.id,
            name: uni.name,
            branches: (uni.campus_branches || [])
              .filter((b: any) => b.is_active)
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((b: any) => ({ id: b.id, name: b.name })),
          })),
        );
      }
    })();
  }, []);

  const left = book.slots_total - book.slots_reserved;
  const soldOut = left <= 0;
  const closed = book.status !== "open";
  const amount = paymentType === "deposit" ? book.deposit_amount : book.full_price;
  const balance = paymentType === "deposit" ? book.full_price - book.deposit_amount : 0;

  const reserve = async () => {
    if (!name.trim() || !phone.trim()) {
      return toast({ title: "Name and phone are required", variant: "destructive" });
    }
    if (!university) {
      return toast({ title: "Select a university/location", variant: "destructive" });
    }
    const selectedUni = universities.find((u) => u.name === university);
    if (selectedUni && selectedUni.branches.length > 0 && !campusBranch) {
      return toast({ title: "Select a campus branch", variant: "destructive" });
    }
    if (deliveryMethod === "pickup" && !pickupOutlet) {
      return toast({ title: "Select a pickup outlet", variant: "destructive" });
    }
    if (deliveryMethod === "delivery" && !deliveryAddress.trim()) {
      return toast({ title: "Enter your delivery address", variant: "destructive" });
    }
    if (deliveryMethod === "delivery" && agentZones.length > 0 && !agentZone) {
      return toast({ title: "Select an agent zone", variant: "destructive" });
    }

    setSubmitting(true);
    const delivery_details =
      deliveryMethod === "pickup"
        ? { outlet: pickupOutlet, university, branch: campusBranch || null }
        : { address: deliveryAddress.trim(), university, branch: campusBranch || null, zone: agentZone || null };

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
    onReserved?.(reservationId);
    toast({ title: "Slot reserved", description: "We will contact you on WhatsApp to confirm payment." });
  };

  const pad = compact ? "p-4" : "p-6 md:p-8";

  if (success) {
    return (
      <section className={`bg-white border border-primary/30 rounded-2xl ${pad} space-y-3`}>
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-6 w-6" />
          <p className="font-serif text-xl font-bold">Slot reserved</p>
        </div>
        <p className="text-sm text-stone-600">
          Reservation ID:{" "}
          <code className="text-xs bg-stone-100 px-2 py-0.5 rounded">{success.slice(0, 8)}</code>
        </p>
        <p className="text-sm text-stone-600">
          We will send an M-Pesa prompt to <strong className="text-stone-900">{phone}</strong> for KSh{" "}
          {amount.toLocaleString()}.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <Link to={`/books/my-reservations?phone=${encodeURIComponent(phone)}`} className="flex-1">
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
    );
  }

  if (closed || soldOut) {
    return (
      <section className={`bg-white border border-stone-200 rounded-2xl ${compact ? "p-6" : "p-8"} text-center`}>
        <p className="font-serif text-xl font-bold text-stone-900 mb-1">
          {soldOut ? "All slots taken" : "Reservations closed"}
        </p>
        <p className="text-sm text-stone-500">New picks every week. Pop back then for fresh reading.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Payment choice */}
      <div className={`${pad} bg-stone-50 border-b border-stone-200`}>
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
      <div className={`${pad} space-y-5`}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Your Name</Label>
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
              inputMode="tel"
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

        {/* University + branch */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              University / Location
            </Label>
            <Select
              value={university}
              onValueChange={(v) => {
                setUniversity(v);
                setCampusBranch("");
              }}
            >
              <SelectTrigger className="bg-stone-50 border-stone-200">
                <SelectValue placeholder="Select university/location" />
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

          {(() => {
            const selected = universities.find((u) => u.name === university);
            if (!selected || selected.branches.length === 0) return null;
            return (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Campus Branch
                </Label>
                <Select value={campusBranch} onValueChange={setCampusBranch}>
                  <SelectTrigger className="bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Choose branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {selected.branches.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
        </div>

        {/* Delivery method */}
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
              <MapPin className="w-4 h-4" /> Pickup
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("delivery")}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                deliveryMethod === "delivery"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-stone-200 text-stone-600 hover:border-primary/30"
              }`}
            >
              <Bike className="w-4 h-4" /> Delivery
            </button>
          </div>
        </div>

        {deliveryMethod === "pickup" && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Pickup Outlet
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
        )}

        {deliveryMethod === "delivery" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                Delivery Address
              </Label>
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Building, room number, landmarks…"
                className="bg-stone-50 border-stone-200"
              />
            </div>
            {agentZones.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Agent Zone
                </Label>
                <Select value={agentZone} onValueChange={setAgentZone}>
                  <SelectTrigger className="bg-stone-50 border-stone-200">
                    <SelectValue placeholder="Choose your zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentZones.map((z) => (
                      <SelectItem key={z.id} value={z.name}>
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Total summary */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">You pay now</span>
            <span className="text-2xl font-bold text-primary">KSh {amount.toLocaleString()}</span>
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
          {submitting ? "Reserving…" : "Confirm Reservation"}
          {!submitting && <ArrowRight className="w-4 h-4" />}
        </button>

        <p className="text-center text-[10px] text-stone-400 font-medium leading-relaxed">
          By reserving, you agree that an unclaimed deposit becomes store credit usable on any product.
        </p>
      </div>
    </section>
  );
}
