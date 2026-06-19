import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Users, Calendar, ChevronDown } from "lucide-react";
import CountdownTimer from "@/components/products/CountdownTimer";
import SEO from "@/components/common/SEO";
import BookReservationPanel from "@/components/books/BookReservationPanel";

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
  const { getCartItemCount } = useCart();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      const isUuid =
        !!slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const filter = isUuid ? `slug.eq.${slug},id.eq.${slug}` : `slug.eq.${slug}`;
      const { data } = await supabase
        .from("books")
        .select("*, book_genres(name)")
        .or(filter)
        .maybeSingle();
      setBook((data as any) || null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafaf9]">
        <Header cartItemCount={getCartItemCount()} />
        <main className="flex-1 container mx-auto px-4 py-12 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <Skeleton className="aspect-[3/4] rounded-lg" />
          </div>
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
  const pct = Math.min(100, (book.slots_reserved / book.slots_total) * 100);
  const canReserve = !closed && !soldOut;
  const synopsisIsLong = (book.synopsis?.length || 0) > 180;

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

      <main className="flex-1 container mx-auto px-4 py-5 md:py-10 pb-[calc(64px+env(safe-area-inset-bottom)+72px)] md:pb-20">
        <Link
          to="/books"
          className="inline-flex items-center text-[11px] md:text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-primary mb-4 md:mb-10 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2" /> The Shelf
        </Link>

        {/* ─── MOBILE COMPACT HERO ─── */}
        <section className="md:hidden animate-fade-in">
          <div className="flex gap-4">
            <div className="relative shrink-0 w-[44vw] max-w-[180px]">
              <div className="absolute -inset-2 bg-primary/5 rounded-xl rotate-1" />
              <div className="relative aspect-[3/4] bg-stone-200 rounded-md overflow-hidden shadow-xl">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={`${book.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-10 w-10 text-stone-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
              {book.book_genres?.name && (
                <span className="inline-block self-start px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full text-[10px] font-bold uppercase tracking-wider italic">
                  {book.book_genres.name}
                </span>
              )}
              <h1 className="font-serif text-xl font-bold text-stone-900 leading-tight line-clamp-3">
                {book.title}
              </h1>
              <p className="text-sm text-stone-500 italic font-serif line-clamp-1">by {book.author}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-600 pt-1">
                <Clock className="w-3 h-3" />
                <CountdownTimer endsAt={book.week_ends_at} compact />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                <Users className="w-3 h-3" />
                <span>
                  <strong>{left}</strong> of {book.slots_total} left
                </span>
              </div>
            </div>
          </div>

          {/* Slim slot bar */}
          <div className="mt-4 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                left <= 5 && !soldOut ? "bg-red-500 animate-pulse" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Synopsis — collapsible */}
          {book.synopsis && (
            <div className="mt-5 border-l-2 border-primary pl-4">
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">
                The Synopsis
              </p>
              <p
                className={`text-stone-700 leading-relaxed text-sm whitespace-pre-line ${
                  !synopsisExpanded && synopsisIsLong ? "line-clamp-4" : ""
                }`}
              >
                {book.synopsis}
              </p>
              {synopsisIsLong && (
                <button
                  onClick={() => setSynopsisExpanded((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider"
                >
                  {synopsisExpanded ? "Show less" : "Read more"}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${synopsisExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          )}

          {/* Inline-only success / closed state for mobile */}
          {(closed || soldOut) && (
            <div className="mt-6">
              <BookReservationPanel book={book} compact />
            </div>
          )}
        </section>

        {/* ─── DESKTOP/TABLET LAYOUT ─── */}
        <article className="hidden md:grid lg:grid-cols-12 gap-8 md:gap-12">
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

            <BookReservationPanel book={book} />
          </div>
        </article>
      </main>

      {/* ─── MOBILE STICKY RESERVE BAR ─── */}
      {canReserve && (
        <div
          className="md:hidden fixed left-0 right-0 z-[90] bg-white border-t border-stone-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] animate-fade-in"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + clamp(52px, 8vh, 64px))",
          }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">
                Deposit from
              </p>
              <p className="text-lg font-bold text-stone-900 leading-tight">
                KSh {book.deposit_amount.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="flex-1 bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/20 uppercase tracking-[0.15em] text-[11px] flex items-center justify-center gap-1.5"
            >
              Reserve <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM-SHEET DRAWER ─── */}
      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="px-4 pt-2 pb-3 text-left">
            <DrawerTitle className="font-serif text-xl font-bold text-stone-900">
              Reserve your copy
            </DrawerTitle>
            <p className="text-xs text-stone-500 line-clamp-1">
              {book.title} · by {book.author}
            </p>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <BookReservationPanel
              book={book}
              compact
              onReserved={() => {
                // Keep open so the user sees the success state, then auto-close after a beat
                setTimeout(() => setSheetOpen(false), 3500);
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Footer />
    </div>
  );
};

export default BookDetail;
