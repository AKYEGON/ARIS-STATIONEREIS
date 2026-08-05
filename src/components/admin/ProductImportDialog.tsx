import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";

/** Columns the importer understands. `name` is the only hard requirement. */
const COLUMNS = [
  "name",
  "slug",
  "description",
  "brand",
  "price",
  "original_price",
  "cost_price",
  "stock",
  "image",
  "categories",
  "is_featured",
  "display_order",
  "sale_starts_at",
  "sale_ends_at",
] as const;

type Row = Record<string, string>;

interface ParsedRow {
  line: number;
  raw: Row;
  errors: string[];
  warnings: string[];
  action: "create" | "update" | "skip";
  existingId?: string;
  categoryIds: string[];
  payload: Record<string, any>;
}

/** Minimal RFC4180 CSV parser (handles quotes, commas and newlines in fields). */
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
};

const csvEscape = (v: any) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const truthy = (v: string) => ["true", "yes", "1", "y"].includes(v.trim().toLowerCase());
const num = (v: string) => (v.trim() === "" ? null : Number(v));

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}

/**
 * CSV import / bulk edit. Export the catalogue, edit in a spreadsheet, upload
 * it back. Rows are matched by slug first, then by name, so re-uploading an
 * export updates the same products instead of duplicating them.
 */
export const ProductImportDialog = ({ open, onOpenChange, onDone }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setRows(null);
    setFileName("");
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("display_order", { ascending: true });
    const { data: assignments } = await supabase
      .from("product_category_assignments")
      .select("product_id, category:product_categories(slug)");

    const bySlug: Record<string, string[]> = {};
    (assignments || []).forEach((a: any) => {
      if (a.category?.slug) (bySlug[a.product_id] ||= []).push(a.category.slug);
    });

    const lines = [COLUMNS.join(",")];
    (data || []).forEach((p: any) => {
      lines.push(
        [
          p.name,
          p.slug,
          p.description,
          p.brand,
          p.price,
          p.original_price,
          p.cost_price,
          p.stock,
          p.image,
          (bySlug[p.id] || []).join("|"),
          p.is_featured,
          p.display_order,
          p.sale_starts_at,
          p.sale_ends_at,
        ]
          .map(csvEscape)
          .join(","),
      );
    });
    if (!data?.length) {
      lines.push(
        ["Example Pen", "", "Blue ballpoint", "Bic", "50", "", "30", "100", "", "pens|writing", "false", "0", "", ""].join(","),
      );
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aris-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setFileName(file.name);
    try {
      const grid = parseCsv(await file.text());
      if (grid.length < 2) {
        toast.error("That file has no data rows");
        setParsing(false);
        return;
      }
      const header = grid[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      if (!header.includes("name")) {
        toast.error("Missing required column: name");
        setParsing(false);
        return;
      }
      const unknown = header.filter((h) => h && !COLUMNS.includes(h as any));

      const [{ data: existing }, { data: cats }] = await Promise.all([
        supabase.from("products").select("id, name, slug"),
        supabase.from("product_categories").select("id, name, slug"),
      ]);

      const bySlug = new Map((existing || []).map((p: any) => [String(p.slug || "").toLowerCase(), p]));
      const byName = new Map((existing || []).map((p: any) => [p.name.trim().toLowerCase(), p]));
      const catBySlug = new Map((cats || []).map((c: any) => [c.slug.toLowerCase(), c]));
      const catByName = new Map((cats || []).map((c: any) => [c.name.trim().toLowerCase(), c]));

      const seen = new Set<string>();
      const parsed: ParsedRow[] = grid.slice(1).map((cells, i) => {
        const raw: Row = {};
        header.forEach((h, idx) => (raw[h] = (cells[idx] ?? "").trim()));

        const errors: string[] = [];
        const warnings: string[] = [];
        if (unknown.length && i === 0) warnings.push(`Ignored columns: ${unknown.join(", ")}`);

        const name = raw.name;
        if (!name) errors.push("name is required");

        const key = (raw.slug || name).toLowerCase();
        if (key && seen.has(key)) errors.push("duplicate row in this file");
        seen.add(key);

        const match =
          (raw.slug && bySlug.get(raw.slug.toLowerCase())) ||
          (name && byName.get(name.toLowerCase())) ||
          undefined;

        ["price", "original_price", "cost_price", "stock", "display_order"].forEach((f) => {
          if (raw[f] && Number.isNaN(Number(raw[f]))) errors.push(`${f} must be a number`);
          else if (raw[f] && Number(raw[f]) < 0) errors.push(`${f} cannot be negative`);
        });
        if (!match && !raw.price) errors.push("price is required for new products");
        if (raw.price && raw.original_price && Number(raw.original_price) < Number(raw.price))
          warnings.push("original_price is below price, no discount will show");

        ["sale_starts_at", "sale_ends_at"].forEach((f) => {
          if (raw[f] && Number.isNaN(Date.parse(raw[f]))) errors.push(`${f} is not a valid date`);
        });

        const categoryIds: string[] = [];
        (raw.categories || "")
          .split(/[|;]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((token) => {
            const cat = catBySlug.get(token.toLowerCase()) || catByName.get(token.toLowerCase());
            if (cat) categoryIds.push(cat.id);
            else warnings.push(`unknown category "${token}" skipped`);
          });

        const primaryName = categoryIds.length
          ? (cats || []).find((c: any) => c.id === categoryIds[0])?.name || ""
          : undefined;

        const payload: Record<string, any> = { name };
        const setIf = (col: string, val: any) => {
          if (val !== undefined && val !== null) payload[col] = val;
        };
        if (raw.description !== undefined && raw.description !== "") payload.description = raw.description;
        if (raw.brand !== undefined && raw.brand !== "") payload.brand = raw.brand;
        if (raw.image) payload.image = raw.image;
        if (raw.price) setIf("price", num(raw.price));
        if (raw.original_price !== undefined && "original_price" in raw)
          payload.original_price = num(raw.original_price);
        if (raw.cost_price) setIf("cost_price", num(raw.cost_price));
        if (raw.stock !== "" && raw.stock !== undefined) setIf("stock", num(raw.stock));
        if (raw.display_order) setIf("display_order", num(raw.display_order));
        if (raw.is_featured !== undefined && raw.is_featured !== "")
          payload.is_featured = truthy(raw.is_featured);
        if ("sale_starts_at" in raw)
          payload.sale_starts_at = raw.sale_starts_at ? new Date(raw.sale_starts_at).toISOString() : null;
        if ("sale_ends_at" in raw)
          payload.sale_ends_at = raw.sale_ends_at ? new Date(raw.sale_ends_at).toISOString() : null;
        if (primaryName !== undefined) payload.category = primaryName;
        if (!match) {
          payload.image = payload.image || "/placeholder.svg";
          payload.category = payload.category ?? "";
          payload.description = payload.description ?? "";
        }

        return {
          line: i + 2,
          raw,
          errors,
          warnings,
          action: errors.length ? "skip" : match ? "update" : "create",
          existingId: match?.id,
          categoryIds,
          payload,
        };
      });

      setRows(parsed);
    } catch (e: any) {
      console.error(e);
      toast.error("Could not read that file");
    }
    setParsing(false);
  };

  const runImport = async () => {
    if (!rows) return;
    const usable = rows.filter((r) => r.action !== "skip");
    setImporting(true);
    setProgress(0);
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (let i = 0; i < usable.length; i++) {
      const r = usable[i];
      try {
        let productId = r.existingId;
        if (r.action === "create") {
          const { data, error } = await supabase
            .from("products")
            .insert(r.payload as any)
            .select("id")
            .single();
          if (error) throw error;
          productId = data.id;
          created++;
        } else {
          const { error } = await supabase.from("products").update(r.payload).eq("id", productId!);
          if (error) throw error;
          updated++;
        }

        if (productId && r.raw.categories !== undefined) {
          await supabase.from("product_category_assignments").delete().eq("product_id", productId);
          if (r.categoryIds.length) {
            await supabase
              .from("product_category_assignments")
              .insert(r.categoryIds.map((category_id) => ({ product_id: productId!, category_id })));
          }
        }
      } catch (e) {
        console.error("Import row failed", r.line, e);
        failed++;
      }
      setProgress(Math.round(((i + 1) / usable.length) * 100));
    }

    setImporting(false);
    toast[failed ? "warning" : "success"](
      `${created} added, ${updated} updated${failed ? `, ${failed} failed` : ""}`,
    );
    reset();
    onDone();
    if (!failed) onOpenChange(false);
  };

  const counts = rows
    ? {
        create: rows.filter((r) => r.action === "create").length,
        update: rows.filter((r) => r.action === "update").length,
        skip: rows.filter((r) => r.action === "skip").length,
      }
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!importing) {
          if (!v) reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Import & bulk edit products
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-xs leading-relaxed">
              Export the catalogue, edit it in Excel or Google Sheets, then upload it back. Rows are
              matched by <strong>slug</strong>, then by <strong>name</strong>: matches are updated,
              everything else is added. Blank cells leave the existing value alone.
              <br />
              Columns: {COLUMNS.join(", ")}. Use <code>categories</code> with pipe separated slugs,
              e.g. <code>pens|writing</code>.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="flex-1">
              <Download className="h-4 w-4 mr-2" /> Export current catalogue (CSV)
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={parsing || importing}
              onClick={() => fileRef.current?.click()}
            >
              {parsing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Choose CSV file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {rows && counts && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">{fileName}</span>
                <Badge className="bg-emerald-600">{counts.create} new</Badge>
                <Badge className="bg-blue-600">{counts.update} updates</Badge>
                {counts.skip > 0 && <Badge variant="destructive">{counts.skip} blocked</Badge>}
              </div>

              <div className="border rounded-md max-h-64 overflow-y-auto divide-y text-xs">
                {rows.map((r) => (
                  <div key={r.line} className="flex items-start gap-2 p-2">
                    {r.errors.length ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        Line {r.line}: {r.raw.name || "(no name)"}{" "}
                        <span className="text-muted-foreground font-normal">
                          {r.action === "update" ? "will update" : r.action === "create" ? "will be added" : "skipped"}
                        </span>
                      </p>
                      {r.errors.map((e) => (
                        <p key={e} className="text-destructive">{e}</p>
                      ))}
                      {r.warnings.map((w) => (
                        <p key={w} className="text-amber-600">{w}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                disabled={importing || counts.create + counts.update === 0}
                onClick={runImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing… {progress}%
                  </>
                ) : (
                  `Import ${counts.create + counts.update} row(s)`
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportDialog;
