import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Book of the Week | ARIS STATIONERIES"
        description="Reserve your slot for our weekly featured books. Pay a small deposit to lock your copy, collect or get delivery on Thursday."
      />
      <Header cartItemCount={getCartItemCount()} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-3">
            <BookOpen className="h-4 w-4" /> Book of the Week
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Reserve your slot. Pay a small deposit.</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Each week we curate special books across genres. Limited slots — reservations close Wednesday midnight, books ready by Thursday.
          </p>
        </div>

        {loading ? (
          <p className="text-center py-12 text-muted-foreground">Loading…</p>
        ) : openBooks.length === 0 && closedBooks.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold mb-1">No books this week yet</p>
              <p className="text-sm text-muted-foreground">Check back on Thursday for new picks!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {openBooks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Open now — Reserve your slot
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {openBooks.map((b) => <BookCard key={b.id} book={b} />)}
                </div>
              </section>
            )}
            {closedBooks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Closed — awaiting handover</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {closedBooks.map((b) => <BookCard key={b.id} book={b} closed />)}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link to="/books/my-reservations">
            <Button variant="outline">View my reservations</Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const BookCard = ({ book, closed }: { book: Book; closed?: boolean }) => {
  const left = book.slots_total - book.slots_reserved;
  const pct = (book.slots_reserved / book.slots_total) * 100;
  return (
    <Link to={`/books/${book.slug || book.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[3/4] bg-muted relative">
          {book.cover_url ? (
            <img src={book.cover_url} alt={`${book.title} cover`} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {book.book_genres?.name && (
            <Badge className="absolute top-2 left-2 bg-primary/90">{book.book_genres.name}</Badge>
          )}
          {!closed && left <= 10 && left > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-600">Only {left} left!</Badge>
          )}
          {left <= 0 && <Badge className="absolute top-2 right-2 bg-gray-700">Sold out</Badge>}
        </div>
        <CardContent className="p-3 space-y-2">
          <div>
            <p className="font-semibold line-clamp-1">{book.title}</p>
            <p className="text-xs text-muted-foreground">by {book.author}</p>
          </div>
          {book.synopsis && <p className="text-xs text-muted-foreground line-clamp-2">{book.synopsis}</p>}
          <div className="flex justify-between items-baseline text-sm">
            <div>
              <div className="text-xs text-muted-foreground">From</div>
              <div className="font-bold text-primary">KSh {book.deposit_amount}</div>
              <div className="text-[10px] text-muted-foreground">deposit · full KSh {book.full_price}</div>
            </div>
            <div className="text-right">
              <div className="text-xs flex items-center gap-1 justify-end text-muted-foreground">
                <Users className="h-3 w-3" /> {book.slots_reserved}/{book.slots_total}
              </div>
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          {!closed && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Closes in</span>
              <CountdownTimer endsAt={book.week_ends_at} compact />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default Books;
