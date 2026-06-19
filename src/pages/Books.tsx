import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import CountdownTimer from "@/components/products/CountdownTimer";
import SEO from "@/components/common/SEO";

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
  genre_id: string | null;
  book_genres?: { name: string } | null;
};

const Books = () => {
  const { getCartItemCount } = useCart();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("books")
        .select("*, book_genres(name)")
        .in("status", ["open", "closed"])
        .order("week_starts_at", { ascending: false });
      setBooks((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const openBooks = books.filter((b) => b.status === "open");
  const closedBooks = books.filter((b) => b.status === "closed");
  const featured = openBooks[0];
  const comingNext = [...openBooks.slice(1), ...closedBooks];

  const totalLeft = openBooks.reduce(
    (sum, b) => sum + Math.max(0, b.slots_total - b.slots_reserved),
    0,
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <SEO
        title="Book of the Week | ARIS STATIONERIES"
        description="Reserve your slot for our weekly curated books. Pay a small deposit to lock your copy, then pick it up or have it delivered."
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 pb-20">
        {/* Editorial Header */}
        <div className="mb-10 md:mb-14 border-b border-stone-200 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-px w-8 bg-primary" />
              <span className="text-primary font-bold text-[11px] uppercase tracking-[0.2em]">
                This Week's Read
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-stone-900 leading-[1.05]">
              Book of the Week
            </h1>
            <p className="text-stone-600 text-sm max-w-md leading-relaxed">
              A new book every week. Pay a small deposit to hold your copy, then pick it up or have it delivered.
            </p>
          </div>
          {featured && (
            <div className="bg-white px-5 py-4 rounded-xl border border-stone-100 shadow-sm flex items-center gap-5 self-start md:self-auto">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">
                  Week Ends In
                </p>
                <div className="text-base font-mono font-bold text-stone-800 tracking-tighter">
                  <CountdownTimer endsAt={featured.week_ends_at} compact />
                </div>
              </div>
              <div className="w-px h-8 bg-stone-200" />
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-1">
                  Availability
                </p>
                <p className="text-base font-bold text-primary">{totalLeft} Slots</p>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <FeaturedSkeleton />
        ) : !featured && closedBooks.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {featured && <FeaturedBook book={featured} />}

            {comingNext.length > 0 && (
              <section className="mt-16 md:mt-24">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h4 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
                    {openBooks.length > 1 ? "Also This Week" : "Coming Next"}
                  </h4>
                  <div className="hidden md:flex gap-2">
                    <button className="p-2 rounded-full border border-stone-200 hover:bg-stone-50 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-stone-600" />
                    </button>
                    <button className="p-2 rounded-full border border-stone-200 hover:bg-stone-50 transition-colors">
                      <ChevronRight className="w-5 h-5 text-stone-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
                  {comingNext.map((b) => (
                    <BookThumb key={b.id} book={b} />
                  ))}
                </div>
              </section>
            )}

            <div className="mt-16 text-center">
              <Link
                to="/books/my-reservations"
                className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700 hover:text-primary transition-colors"
              >
                View my reservations
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

const FeaturedBook = ({ book }: { book: Book }) => {
  const left = book.slots_total - book.slots_reserved;
  const soldOut = left <= 0;
  const url = `/books/${book.slug || book.id}`;

  return (
    <article className="grid lg:grid-cols-12 gap-8 md:gap-12">
      {/* Cover */}
      <Link to={url} className="lg:col-span-5 block">
        <div className="relative group">
          <div className="absolute -inset-3 md:-inset-4 bg-primary/5 rounded-2xl rotate-1 group-hover:rotate-0 transition-transform duration-700" />
          <div className="relative aspect-[3/4] bg-stone-200 rounded-lg overflow-hidden shadow-2xl">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={`${book.title} cover`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-16 w-16 text-stone-400" />
              </div>
            )}
            <div className="absolute bottom-5 left-5 bg-stone-900/90 backdrop-blur px-4 py-2 text-white text-[10px] font-bold tracking-widest uppercase">
              This Week's Pick
            </div>
            {!soldOut && left <= 10 && (
              <div className="absolute top-5 right-5 bg-red-600 text-white px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full">
                Only {left} left
              </div>
            )}
            {soldOut && (
              <div className="absolute top-5 right-5 bg-stone-800 text-white px-3 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full">
                Sold out
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Details + CTA */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="mb-8 space-y-4">
          {book.book_genres?.name && (
            <span className="inline-block px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-[11px] font-bold uppercase tracking-wider italic">
              {book.book_genres.name}
            </span>
          )}
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 leading-tight">
            <Link to={url} className="hover:text-primary transition-colors">
              {book.title}
            </Link>
          </h2>
          <p className="text-xl text-stone-500 italic font-serif">by {book.author}</p>
          {book.synopsis && (
            <p className="text-stone-600 leading-relaxed text-base md:text-lg max-w-2xl pt-2 line-clamp-5">
              {book.synopsis}
            </p>
          )}
        </div>

        {/* Reserve panel preview */}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 md:p-8 bg-stone-50 border-b border-stone-200">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-widest mb-5">
              Choose Your Reservation
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative flex flex-col p-5 border-2 border-primary bg-primary/5 rounded-xl">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Secure Deposit
                </span>
                <span className="text-2xl font-bold text-stone-900">
                  KSh {book.deposit_amount.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-500 mt-1">
                  Pay balance of KSh {(book.full_price - book.deposit_amount).toLocaleString()} on pickup
                </span>
              </div>
              <div className="relative flex flex-col p-5 border-2 border-stone-200 rounded-xl">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                  Full Purchase
                </span>
                <span className="text-2xl font-bold text-stone-900">
                  KSh {book.full_price.toLocaleString()}
                </span>
                <span className="text-[10px] text-stone-500 mt-1">Priority handover</span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                  Reservations Close
                </p>
                <div className="text-stone-800 font-semibold">
                  <CountdownTimer endsAt={book.week_ends_at} compact />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">
                  Handover Day
                </p>
                <p className="text-stone-800 font-semibold">
                  {new Date(book.pickup_date).toLocaleDateString("en-KE", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Users className="w-3.5 h-3.5" />
              <span>
                <strong className="text-stone-800">{book.slots_reserved}</strong> of{" "}
                {book.slots_total} slots reserved
              </span>
              <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden ml-2">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (book.slots_reserved / book.slots_total) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <Link to={url} className="block">
              <button
                disabled={soldOut}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-stone-300 text-primary-foreground font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2"
              >
                {soldOut ? "Sold Out" : "Reserve Your Copy"}
                {!soldOut && <ArrowRight className="w-4 h-4" />}
              </button>
            </Link>

            <p className="text-center text-[10px] text-stone-400 font-medium">
              Unclaimed deposits convert to store credit, usable on any product.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

const BookThumb = ({ book }: { book: Book }) => {
  const url = `/books/${book.slug || book.id}`;
  const left = book.slots_total - book.slots_reserved;
  const closed = book.status === "closed";
  return (
    <Link to={url} className="space-y-3 group block">
      <div className="aspect-[3/4] bg-stone-200 rounded-lg overflow-hidden relative">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={`${book.title} cover`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-10 w-10 text-stone-400" />
          </div>
        )}
        {closed && (
          <div className="absolute inset-0 bg-stone-900/40 flex items-end p-3">
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">
              Handover pending
            </span>
          </div>
        )}
        {!closed && left <= 0 && (
          <div className="absolute top-2 right-2 bg-stone-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Sold out
          </div>
        )}
      </div>
      <div>
        {book.book_genres?.name && (
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
            {book.book_genres.name}
          </p>
        )}
        <h5 className="font-serif font-bold text-stone-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {book.title}
        </h5>
        <p className="text-xs text-stone-500 italic mt-0.5">{book.author}</p>
      </div>
    </Link>
  );
};

const FeaturedSkeleton = () => (
  <div className="grid lg:grid-cols-12 gap-12">
    <div className="lg:col-span-5">
      <Skeleton className="aspect-[3/4] rounded-lg" />
    </div>
    <div className="lg:col-span-7 space-y-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="max-w-md mx-auto text-center py-20">
    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-5">
      <BookOpen className="h-8 w-8 text-stone-400" />
    </div>
    <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
      The shelf is being curated
    </h3>
    <p className="text-stone-500 text-sm">
      Our next selection drops soon. Pop back then for fresh reading.
    </p>
  </div>
);

export default Books;
