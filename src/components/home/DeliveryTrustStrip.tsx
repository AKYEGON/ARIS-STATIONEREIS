import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  IconSameDayScooter,
  IconCountrywideRoute,
  IconMpesaPhone,
  IconPickupPoint,
  IconStar,
  IconVerifiedBuyer,
} from "@/components/icons/aris-icons";

interface Proof {
  id: string;
  customer_name: string;
  customer_photo: string | null;
  review_text: string;
  rating: number;
  university: string | null;
  is_verified_purchase: boolean;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const ROTATE_MS = 7000;

const DeliveryTrustStrip = () => {
  const [outlets, setOutlets] = useState<string[]>([]);
  const [proof, setProof] = useState<Proof[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [outletRes, proofRes] = await Promise.all([
        supabase
          .from("pickup_outlets")
          .select("name,display_order")
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("customer_testimonials")
          .select("id,customer_name,customer_photo,review_text,rating,university,is_verified_purchase")
          .eq("is_published", true)
          .gte("rating", 4)
          .order("is_featured", { ascending: false })
          .order("display_order", { ascending: true })
          .limit(12),
      ]);
      if (cancelled) return;
      setOutlets((outletRes.data || []).map((o: any) => o.name));
      setProof((proofRes.data || []) as Proof[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (proof.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % proof.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [proof.length]);

  const current = proof[idx];

  const facts = [
    {
      Icon: IconSameDayScooter,
      label: "Same-day in Nairobi",
      detail: "Order before 11am, it reaches you today.",
      tone: "bg-primary text-primary-foreground shadow-md shadow-primary/25",
    },
    {
      Icon: IconCountrywideRoute,
      label: "Countrywide in 48 hours",
      detail: "Kisumu, Eldoret, Mombasa, Nakuru and everywhere between.",
      tone: "bg-blue-600 text-primary-foreground shadow-md shadow-blue-600/25",
    },
    {
      Icon: IconMpesaPhone,
      label: "Pay with M-Pesa",
      detail: "Till confirmation on the spot. No account needed.",
      tone: "bg-emerald-600 text-primary-foreground shadow-md shadow-emerald-600/25",
    },
    {
      Icon: IconPickupPoint,
      label: "Pickup",
      detail:
        outlets.length > 0
          ? `Collect in person, pay nothing for delivery. ${outlets.length} pickup ${outlets.length === 1 ? "point" : "points"} listed at checkout.`
          : "Collect in person, pay nothing for delivery. Pickup points are listed at checkout.",
      tone: "bg-amber-500 text-primary-foreground shadow-md shadow-amber-500/25",
    },
  ];

  return (
    <section className="border-y border-border bg-background py-10 sm:py-14">
      <div className="container px-4">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          {/* Operational facts */}
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              How the order actually reaches you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Two delivery lanes, M-Pesa on confirmation, and a counter you can walk into.
            </p>

            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {facts.map(({ Icon, label, detail, tone }) => (
                <li key={label} className="flex gap-3">
                  <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <Icon size={24} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real customer proof, rotating */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <IconVerifiedBuyer size={16} />
              From the customers page
            </div>

            {current ? (
              <figure className="mt-4">
                <div className="flex gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar key={i} size={15} filled={i < current.rating} />
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed">
                  "{current.review_text.length > 190
                    ? `${current.review_text.slice(0, 190).trimEnd()}...`
                    : current.review_text}"
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  {current.customer_photo ? (
                    <img
                      src={current.customer_photo}
                      alt=""
                      loading="lazy"
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {initials(current.customer_name)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{current.customer_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {current.university || (current.is_verified_purchase ? "Verified order" : "ARIS customer")}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Reviews appear here as soon as customers publish them.
              </p>
            )}

            <div className="mt-5 flex items-center justify-between">
              <Link to="/testimonials" className="text-sm font-medium text-primary hover:underline">
                Read all reviews
              </Link>
              {proof.length > 1 && (
                <div className="flex gap-1.5">
                  {proof.slice(0, 6).map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => setIdx(i)}
                      aria-label={`Show review ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === idx % Math.min(proof.length, 6) ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeliveryTrustStrip;
