import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, BookOpen, Users, Tag, Image as ImageIcon, MessageCircle, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BookWhatsAppModal } from "./BookWhatsAppModal";

type UserRole = 'admin' | 'manager' | 'employee' | 'agent';
interface BooksAdminTabProps { userRole?: UserRole }

type Genre = { id: string; name: string; slug: string; display_order: number; is_active: boolean };
type Book = {
  id: string;
  title: string;
  author: string;
  genre_id: string | null;
  cover_url: string | null;
  synopsis: string | null;
  isbn: string | null;
  slug: string | null;
  full_price: number;
  deposit_amount: number;
  slots_total: number;
  slots_reserved: number;
  min_threshold: number;
  week_starts_at: string;
  week_ends_at: string;
  pickup_date: string;
  status: "draft" | "open" | "closed" | "fulfilled" | "cancelled";
};
type Reservation = {
  id: string;
  book_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  payment_type: "deposit" | "full";
  amount_paid: number;
  balance_due: number;
  delivery_method: string | null;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-400",
  open: "bg-green-500",
  closed: "bg-orange-500",
  fulfilled: "bg-blue-500",
  cancelled: "bg-red-500",
};

const RES_STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500",
  reserved: "bg-blue-500",
  balance_paid: "bg-purple-500",
  collected: "bg-green-600",
  delivered: "bg-green-600",
  released: "bg-gray-500",
  refunded: "bg-orange-500",
  cancelled: "bg-red-500",
};

const toLocalInput = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

export const BooksAdminTab = ({ userRole = 'admin' }: BooksAdminTabProps) => {
  const canManageBooks = userRole === 'admin';
  const [genres, setGenres] = useState<Genre[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  // book dialog
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    genre_id: "",
    cover_url: "",
    synopsis: "",
    isbn: "",
    full_price: "",
    deposit_amount: "",
    slots_total: "100",
    min_threshold: "0",
    week_starts_at: "",
    week_ends_at: "",
    pickup_date: "",
    status: "draft" as Book["status"],
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // genre dialog
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreForm, setGenreForm] = useState({ name: "", display_order: 0, is_active: true });

  // reservation filter
  const [resFilterBook, setResFilterBook] = useState<string>("all");

  // whatsapp modal
  const [waOpen, setWaOpen] = useState(false);
  const [waReservation, setWaReservation] = useState<Reservation | null>(null);

  // payment dialog
  const [payOpen, setPayOpen] = useState(false);
  const [payReservation, setPayReservation] = useState<Reservation | null>(null);
  const [payForm, setPayForm] = useState({ kind: "deposit" as "deposit" | "balance" | "full", amount: "", mpesa_receipt: "", mpesa_phone: "", notes: "" });
  const [paySaving, setPaySaving] = useState(false);


  const loadAll = async () => {
    setLoading(true);
    const [g, b, r] = await Promise.all([
      supabase.from("book_genres").select("*").order("display_order"),
      supabase.from("books").select("*").order("week_starts_at", { ascending: false }),
      supabase.from("book_reservations").select("*").order("created_at", { ascending: false }),
    ]);
    if (g.data) setGenres(g.data as Genre[]);
    if (b.data) setBooks(b.data as Book[]);
    if (r.data) setReservations(r.data as Reservation[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ===== Genres =====
  const openGenreDialog = (g?: Genre) => {
    if (g) {
      setEditingGenre(g);
      setGenreForm({ name: g.name, display_order: g.display_order, is_active: g.is_active });
    } else {
      setEditingGenre(null);
      setGenreForm({ name: "", display_order: genres.length, is_active: true });
    }
    setGenreDialogOpen(true);
  };

  const saveGenre = async () => {
    if (!genreForm.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    const slug = genreForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = { name: genreForm.name.trim(), slug, display_order: genreForm.display_order, is_active: genreForm.is_active };
    const { error } = editingGenre
      ? await supabase.from("book_genres").update(payload).eq("id", editingGenre.id)
      : await supabase.from("book_genres").insert(payload);
    if (error) return toast({ title: "Failed to save genre", description: error.message, variant: "destructive" });
    toast({ title: editingGenre ? "Genre updated" : "Genre created" });
    setGenreDialogOpen(false);
    loadAll();
  };

  const deleteGenre = async (id: string) => {
    if (!confirm("Delete this genre?")) return;
    const { error } = await supabase.from("book_genres").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Genre deleted" });
    loadAll();
  };

  // ===== Books =====
  const openBookDialog = (b?: Book) => {
    if (b) {
      setEditingBook(b);
      setBookForm({
        title: b.title,
        author: b.author,
        genre_id: b.genre_id || "",
        cover_url: b.cover_url || "",
        synopsis: b.synopsis || "",
        isbn: b.isbn || "",
        full_price: String(b.full_price),
        deposit_amount: String(b.deposit_amount),
        slots_total: String(b.slots_total),
        min_threshold: String(b.min_threshold),
        week_starts_at: toLocalInput(b.week_starts_at),
        week_ends_at: toLocalInput(b.week_ends_at),
        pickup_date: toLocalInput(b.pickup_date),
        status: b.status,
      });
    } else {
      setEditingBook(null);
      // default week: next Thursday → Wednesday
      const now = new Date();
      const day = now.getDay();
      const nextThu = new Date(now);
      nextThu.setDate(now.getDate() + ((4 - day + 7) % 7 || 7));
      nextThu.setHours(0, 0, 0, 0);
      const wed = new Date(nextThu);
      wed.setDate(nextThu.getDate() + 6);
      wed.setHours(23, 59, 0, 0);
      const pickup = new Date(wed);
      pickup.setDate(wed.getDate() + 1);
      pickup.setHours(10, 0, 0, 0);
      setBookForm({
        title: "",
        author: "",
        genre_id: "",
        cover_url: "",
        synopsis: "",
        isbn: "",
        full_price: "",
        deposit_amount: "",
        slots_total: "100",
        min_threshold: "0",
        week_starts_at: toLocalInput(nextThu.toISOString()),
        week_ends_at: toLocalInput(wed.toISOString()),
        pickup_date: toLocalInput(pickup.toISOString()),
        status: "draft",
      });
    }
    setCoverFile(null);
    setBookDialogOpen(true);
  };

  const uploadCover = async (file: File) => {
    const ext = file.name.split(".").pop();
    const name = `books/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(name, file);
    if (error) throw error;
    return supabase.storage.from("product-images").getPublicUrl(name).data.publicUrl;
  };

  const saveBook = async () => {
    if (!bookForm.title || !bookForm.author || !bookForm.full_price || !bookForm.deposit_amount) {
      return toast({ title: "Fill required fields", variant: "destructive" });
    }
    try {
      let cover_url = bookForm.cover_url;
      if (coverFile) cover_url = await uploadCover(coverFile);

      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        genre_id: bookForm.genre_id || null,
        cover_url: cover_url || null,
        synopsis: bookForm.synopsis || null,
        isbn: bookForm.isbn || null,
        full_price: Number(bookForm.full_price),
        deposit_amount: Number(bookForm.deposit_amount),
        slots_total: Number(bookForm.slots_total),
        min_threshold: Number(bookForm.min_threshold),
        week_starts_at: new Date(bookForm.week_starts_at).toISOString(),
        week_ends_at: new Date(bookForm.week_ends_at).toISOString(),
        pickup_date: new Date(bookForm.pickup_date).toISOString(),
        status: bookForm.status,
      };

      const { error } = editingBook
        ? await supabase.from("books").update(payload).eq("id", editingBook.id)
        : await supabase.from("books").insert(payload);
      if (error) throw error;
      toast({ title: editingBook ? "Book updated" : "Book created" });
      setBookDialogOpen(false);
      loadAll();
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book? Reservations will also be removed.")) return;
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Book deleted" });
    loadAll();
  };

  // ===== Reservations =====
  const updateReservationStatus = async (id: string, status: string) => {
    const { error } = await supabase.rpc("update_reservation_status", { p_reservation_id: id, p_status: status as any });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Status updated" });
    loadAll();
  };

  const releaseReservation = async (id: string) => {
    if (!confirm("Release this reservation? Slot will be freed and any deposit converted to store credit.")) return;
    const { error } = await supabase.rpc("release_reservation", { p_reservation_id: id, p_issue_credit: true });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Reservation released" });
    loadAll();
  };

  const openPaymentDialog = (r: Reservation) => {
    const book = books.find((b) => b.id === r.book_id);
    const depositOutstanding = Math.max(0, (book?.deposit_amount || 0) - Number(r.amount_paid));
    const defaultKind: "deposit" | "balance" | "full" =
      depositOutstanding > 0 ? "deposit" : "balance";
    const defaultAmount =
      depositOutstanding > 0 ? depositOutstanding : Number(r.balance_due);
    setPayReservation(r);
    setPayForm({
      kind: defaultKind,
      amount: String(defaultAmount || ""),
      mpesa_receipt: "",
      mpesa_phone: r.customer_phone || "",
      notes: "",
    });
    setPayOpen(true);
  };

  const recordPayment = async () => {
    if (!payReservation) return;
    const amt = Number(payForm.amount);
    if (!amt || amt <= 0) return toast({ title: "Enter a valid amount", variant: "destructive" });
    setPaySaving(true);
    const { error } = await supabase.rpc("record_book_payment", {
      p_reservation_id: payReservation.id,
      p_kind: payForm.kind as any,
      p_amount: amt,
      p_mpesa_receipt: payForm.mpesa_receipt || null,
      p_mpesa_phone: payForm.mpesa_phone || null,
      p_notes: payForm.notes || null,
    });
    setPaySaving(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Payment recorded" });
    setPayOpen(false);
    loadAll();
  };


  const filteredReservations =
    resFilterBook === "all" ? reservations : reservations.filter((r) => r.book_id === resFilterBook);

  return (
    <Tabs defaultValue="books" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="books"><BookOpen className="h-4 w-4 mr-1.5" />Books</TabsTrigger>
        <TabsTrigger value="reservations"><Users className="h-4 w-4 mr-1.5" />Reservations</TabsTrigger>
        <TabsTrigger value="genres"><Tag className="h-4 w-4 mr-1.5" />Genres</TabsTrigger>
      </TabsList>

      {/* BOOKS */}
      <TabsContent value="books" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Book of the Week</h3>
          <Button onClick={() => openBookDialog()}><Plus className="h-4 w-4 mr-1" />Add Book</Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : books.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No books yet. Add your first weekly pick.</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <Card key={b.id} className="overflow-hidden">
                <div className="aspect-[3/4] bg-muted relative">
                  {b.cover_url ? (
                    <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 text-white ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>
                </div>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <p className="font-semibold line-clamp-1">{b.title}</p>
                    <p className="text-xs text-muted-foreground">by {b.author}</p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Full: <strong>KSh {b.full_price}</strong></span>
                    <span>Deposit: <strong>KSh {b.deposit_amount}</strong></span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Slots: <strong className="text-foreground">{b.slots_reserved} / {b.slots_total}</strong>
                    {b.min_threshold > 0 && <> (min {b.min_threshold})</>}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Closes {new Date(b.week_ends_at).toLocaleDateString()} • Pickup {new Date(b.pickup_date).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openBookDialog(b)}>
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBook(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* RESERVATIONS */}
      <TabsContent value="reservations" className="space-y-4 mt-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-lg font-semibold">Reservations</h3>
          <Select value={resFilterBook} onValueChange={setResFilterBook}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All books</SelectItem>
              {books.map((b) => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filteredReservations.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No reservations yet.</CardContent></Card>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Paid / Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((r) => {
                  const book = books.find((b) => b.id === r.book_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{r.customer_phone}</div>
                      </TableCell>
                      <TableCell className="text-sm">{book?.title || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.payment_type}</Badge></TableCell>
                      <TableCell className="text-xs">
                        <div>Paid: <strong>KSh {r.amount_paid}</strong></div>
                        {r.balance_due > 0 && <div className="text-orange-600">Due: KSh {r.balance_due}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-white ${RES_STATUS_COLORS[r.status] || "bg-gray-400"}`}>
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-700 border-green-600/40 hover:bg-green-50"
                            onClick={() => { setWaReservation(r); setWaOpen(true); }}
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />WhatsApp
                          </Button>
                          <Select value="" onValueChange={(v) => updateReservationStatus(r.id, v)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Set status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="reserved">Reserved</SelectItem>
                              <SelectItem value="balance_paid">Balance paid</SelectItem>
                              <SelectItem value="collected">Collected</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" className="text-orange-600 h-8" onClick={() => releaseReservation(r.id)}>
                            Release
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* GENRES */}
      <TabsContent value="genres" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Genres</h3>
          <Button onClick={() => openGenreDialog()}><Plus className="h-4 w-4 mr-1" />Add Genre</Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Order</TableHead><TableHead>Active</TableHead><TableHead /></TableRow>
              </TableHeader>
              <TableBody>
                {genres.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.display_order}</TableCell>
                    <TableCell>{g.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Hidden</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openGenreDialog(g)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteGenre(g.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* BOOK DIALOG */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBook ? "Edit Book" : "Add Book of the Week"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Title *</Label><Input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></div>
              <div><Label>Author *</Label><Input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Genre</Label>
                <Select value={bookForm.genre_id} onValueChange={(v) => setBookForm({ ...bookForm, genre_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger>
                  <SelectContent>
                    {genres.filter((g) => g.is_active).map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>ISBN (optional)</Label><Input value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} /></div>
            </div>
            <div>
              <Label>Synopsis</Label>
              <Textarea rows={3} value={bookForm.synopsis} onChange={(e) => setBookForm({ ...bookForm, synopsis: e.target.value })} />
            </div>
            <div>
              <Label>Cover image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
              {(coverFile || bookForm.cover_url) && (
                <img src={coverFile ? URL.createObjectURL(coverFile) : bookForm.cover_url} alt="" className="mt-2 h-32 rounded" />
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>Full price (KSh) *</Label><Input type="number" value={bookForm.full_price} onChange={(e) => setBookForm({ ...bookForm, full_price: e.target.value })} /></div>
              <div><Label>Deposit (KSh) *</Label><Input type="number" value={bookForm.deposit_amount} onChange={(e) => setBookForm({ ...bookForm, deposit_amount: e.target.value })} /></div>
              <div><Label>Total slots *</Label><Input type="number" value={bookForm.slots_total} onChange={(e) => setBookForm({ ...bookForm, slots_total: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Min threshold (auto-cancel if not met)</Label><Input type="number" value={bookForm.min_threshold} onChange={(e) => setBookForm({ ...bookForm, min_threshold: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={bookForm.status} onValueChange={(v: any) => setBookForm({ ...bookForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (hidden)</SelectItem>
                    <SelectItem value="open">Open (accepting reservations)</SelectItem>
                    <SelectItem value="closed">Closed (visible, no new reservations)</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>Opens (Thu)</Label><Input type="datetime-local" value={bookForm.week_starts_at} onChange={(e) => setBookForm({ ...bookForm, week_starts_at: e.target.value })} /></div>
              <div><Label>Closes (Wed 23:59)</Label><Input type="datetime-local" value={bookForm.week_ends_at} onChange={(e) => setBookForm({ ...bookForm, week_ends_at: e.target.value })} /></div>
              <div><Label>Pickup / handover</Label><Input type="datetime-local" value={bookForm.pickup_date} onChange={(e) => setBookForm({ ...bookForm, pickup_date: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBookDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveBook}>{editingBook ? "Update" : "Create"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* GENRE DIALOG */}
      <Dialog open={genreDialogOpen} onOpenChange={setGenreDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader><DialogTitle>{editingGenre ? "Edit Genre" : "Add Genre"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={genreForm.name} onChange={(e) => setGenreForm({ ...genreForm, name: e.target.value })} /></div>
            <div><Label>Display order</Label><Input type="number" value={genreForm.display_order} onChange={(e) => setGenreForm({ ...genreForm, display_order: Number(e.target.value) })} /></div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={genreForm.is_active} onCheckedChange={(v) => setGenreForm({ ...genreForm, is_active: v })} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setGenreDialogOpen(false)}>Cancel</Button><Button onClick={saveGenre}>Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <BookWhatsAppModal
        open={waOpen}
        onOpenChange={setWaOpen}
        reservation={waReservation}
        book={waReservation ? (books.find((b) => b.id === waReservation.book_id) as any) : null}
      />
    </Tabs>
  );
};

export default BooksAdminTab;
