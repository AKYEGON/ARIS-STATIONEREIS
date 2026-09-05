import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Download, FileText, MessageCircle, RefreshCw } from "lucide-react";
import { formatPhoneForWhatsApp } from "@/types/communication";
import { SchoolListQuoteDialog, type QuoteLine } from "./SchoolListQuoteDialog";

interface Submission {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  school_or_course: string | null;
  list_text: string | null;
  file_url: string | null;
  file_name: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  quote_items: QuoteLine[] | null;
  quote_total: number | null;
  quote_discount: number | null;
  order_id: string | null;
}


const STATUSES = ["new", "reviewing", "quoted", "converted", "closed"];

const STATUS_STYLE: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-amber-100 text-amber-800",
  quoted: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  closed: "bg-muted text-muted-foreground",
};

export const SchoolListSubmissions = () => {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [quoteFor, setQuoteFor] = useState<Submission | null>(null);


  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("school_list_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load submissions");
    else setRows((data || []) as unknown as Submission[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("school_list_submissions")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error("Failed to update status");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const saveNotes = async (id: string) => {
    const admin_notes = notesDraft[id] ?? "";
    const { error } = await supabase
      .from("school_list_submissions")
      .update({ admin_notes })
      .eq("id", id);
    if (error) return toast.error("Failed to save notes");
    toast.success("Notes saved");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, admin_notes } : r)));
  };

  /** Files live in a private bucket, so hand out a short-lived signed URL. */
  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("school-lists")
      .createSignedUrl(path, 300);
    if (error || !data) return toast.error("Could not open the file");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const whatsapp = (s: Submission) => {
    const msg = `*ARIS STATIONERIES*\n\nHi ${s.customer_name}, we received your list${
      s.school_or_course ? ` for ${s.school_or_course}` : ""
    }. Here is what we have and the total:`;
    window.open(
      `https://wa.me/${formatPhoneForWhatsApp(s.customer_phone)}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener",
    );
  };

  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            School Lists
            {newCount > 0 && <Badge className="bg-blue-600">{newCount} new</Badge>}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Lists customers sent through /school-list
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={fetchRows}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!loading && visible.length === 0 && (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        )}
        {visible.map((s) => (
          <div key={s.id} className="rounded-lg border p-3 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">{s.customer_name}</span>
              <span className="text-xs text-muted-foreground">{s.customer_phone}</span>
              {s.school_or_course && (
                <Badge variant="outline" className="text-[10px]">
                  {s.school_or_course}
                </Badge>
              )}
              <Badge className={`text-[10px] ${STATUS_STYLE[s.status] || ""}`}>{s.status}</Badge>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {new Date(s.created_at).toLocaleString()}
              </span>
            </div>

            {s.list_text && (
              <pre className="text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap break-words max-h-48 overflow-auto">
                {s.list_text}
              </pre>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {s.file_url && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openFile(s.file_url!)}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  {s.file_name || "Attachment"}
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => whatsapp(s)}>
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                WhatsApp
              </Button>
              <Select value={s.status} onValueChange={(v) => setStatus(s.id, v)}>
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((st) => (
                    <SelectItem key={st} value={st} className="capitalize">
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Textarea
                value={notesDraft[s.id] ?? s.admin_notes ?? ""}
                onChange={(e) => setNotesDraft((p) => ({ ...p, [s.id]: e.target.value }))}
                placeholder="Internal notes"
                rows={2}
                className="text-xs"
              />
              <Button size="sm" variant="secondary" className="h-8 text-xs self-end" onClick={() => saveNotes(s.id)}>
                Save
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SchoolListSubmissions;
