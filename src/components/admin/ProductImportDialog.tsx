import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const COLUMNS = [
  "slug",
  "name",
  "description",
  "price",
  "original_price",
  "cost_price",
  "stock",
  "category",
  "categories",
  "image",
  "is_featured",
  "is_common",
  "display_order",
  "sale_starts_at",
  "sale_ends_at",
] as const;

type Row = Record<string, string>;

interface ParsedRow {
  line: number;
  action: "create" | "update" | "skip";
  errors: string[];
  warnings: string[];
  existingId?: string;
  values: {
    slug?: string;
    name: string;
    description: string | null;
    price: number;
    original_price: number | null;
    cost_price: number | null;
    stock: number;
    category: string;
    image: string;
    is_featured: boolean;
    is_common: boolean;
    display_order: number;
    sale_starts_at: string | null;
    sale_ends_at: string | null;
  };
  categoryIds: string[];
}

const norm = (v?: string) => (v ?? "").trim();
const toBool = (v?: string) => ["1", "true", "yes", "y"].includes(norm(v).toLowerCase());

const toNumber = (v: string | undefined, field: string, errors: string[], fallback: number | null = null) => {
  const raw = norm(v).replace(/[, ]/g, "").replace(/^KSh/i, "");
  if (!raw) return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) {
    errors.push(`${field} is not a number ("${v}")`);
    return fallback;
  }
  if (n < 0) {
    errors.push(`${field} cannot be negative`);
    return fallback;
  }
  return n;
};

const toDate = (v: string | undefined, field: string, errors: string[]) => {
  const raw = norm(v);
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    errors.push(`${field} is not a valid date ("${v}")`);
    return null;
  }
  return d.toISOString();
};

interface Props {
  onImported: () => void;
}

const ProductImportDialog = ({ onImported }: Props) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setRows([]);
    setFileName("");
    setProgress(0);
  };

  const downloadCsv = (csv: string, name: string) => {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const sample = {
      slug: "",
      name: "Oxford A4 Counter Book 288 Pages",
      description: "Hard cover counter book, 288 pages, A4.",
      price: "450",
      original_price: "600",
      cost_price: "310",
      stock: "40",
      category: "Notebooks & Books",
      categories: "Notebooks & Books|Filing & Organization",
      image: "https://example.com/counter-book.jpg",
      is_featured: "false",
      is_common: "true",
      display_order: "0",
      sale_starts_at: "",
      sale_ends_at: "",
    };
    downloadCsv(Papa.unparse({ fields: [...COLUMNS], data: [sample] }), "aris-product-import-template.csv");
  };

  const exportCurrent = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("slug,name,description,price,original_price,cost_price,stock,category,image,is_featured,is_common,display_order,sale_starts_at,sale_ends_at")
      .order("display_order");
    if (error) {
      toast.error("Could not export products");
      return;
    }
    const withCats = (data || []).map((p: any) => ({ ...p, categories: "" }));
    downloadCsv(
      Papa.unparse({ fields: [...COLUMNS], data: withCats.map((p) => COLUMNS.map((c) => p[c] ?? "")) }),
      `aris-products-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success(`Exported ${data?.length ?? 0} products`);
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = Papa.parse<Row>(text, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      });

      const missingName = !parsed.meta.fields?.includes("name");
      if (missingName) {
        toast.error('CSV must contain a "name" column. Download the template.');
        setRows([]);
        return;
      }

      const [{ data: products }, { data: cats }] = await Promise.all([
        supabase.from("products").select("id,name,slug"),
        supabase.from("product_categories").select("id,name,slug"),
      ]);

      const bySlug = new Map((products || []).filter((p) => p.slug).map((p) => [p.slug!.toLowerCase(), p]));
      const byName = new Map((products || []).map((p) => [p.name.trim().toLowerCase(), p]));
      const catByKey = new Map<string, string>();
      (cats || []).forEach((c) => {
        catByKey.set(c.name.trim().toLowerCase(), c.id);
        catByKey.set(c.slug.trim().toLowerCase(), c.id);
      });

      const seen = new Set<string>();
      const result: ParsedRow[] = parsed.data.map((raw, i) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const name = norm(raw.name);
        if (!name) errors.push("name is required");

        const slug = norm(raw.slug).toLowerCase();
        const key = slug || name.toLowerCase();
        if (key && seen.has(key)) errors.push("duplicate row for this product inside the file");
        if (key) seen.add(key);

        const existing = slug ? bySlug.get(slug) : byName.get(name.toLowerCase());
        if (slug && !existing) warnings.push("slug not found, will be created as a new product");

        const price = toNumber(raw.price, "price", errors, existing ? null : 0);
        if (!existing && (price === null || price === 0) && !norm(raw.price)) {
          errors.push("price is required for new products");
        }
        const original_price = toNumber(raw.original_price, "original_price", errors);
        const cost_price = toNumber(raw.cost_price, "cost_price", errors);
        if (original_price !== null && price !== null && original_price <= price) {
          warnings.push("original_price is not higher than price, no SALE badge will show");
        }
        const stock = toNumber(raw.stock, "stock", errors, 0) ?? 0;

        const categoryNames = norm(raw.categories)
          .split(/[|;]/)
          .map((c) => c.trim())
          .filter(Boolean);
        const categoryIds: string[] = [];
        categoryNames.forEach((c) => {
          const id = catByKey.get(c.toLowerCase());
          if (id) categoryIds.push(id);
          else warnings.push(`category "${c}" does not exist, skipped`);
        });

        const image = norm(raw.image);
        if (!image && !existing) warnings.push("no image, placeholder will be used");

        const sale_starts_at = toDate(raw.sale_starts_at, "sale_starts_at", errors);
        const sale_ends_at = toDate(raw.sale_ends_at, "sale_ends_at", errors);
        if (sale_starts_at && sale_ends_at && sale_starts_at >= sale_ends_at) {
          errors.push("sale_ends_at must be after sale_starts_at");
        }

        return {
          line: i + 2,
          action: errors.length ? "skip" : existing ? "update" : "create",
          errors,
          warnings,
          existingId: existing?.id,
          categoryIds,
          values: {
            slug: slug || undefined,
            name,
            description: norm(raw.description) || null,
            price: price ?? 0,
            original_price,
            cost_price,
            stock: Math.round(stock),
            category: norm(raw.category) || categoryNames[0] || "General",
            image: image || PLACEHOLDER_IMAGE,
            is_featured: toBool(raw.is_featured),
            is_common: toBool(raw.is_common),
            display_order: Math.round(toNumber(raw.display_order, "display_order", errors, 0) ?? 0),
            sale_starts_at,
            sale_ends_at,
          },
        };
      });

      setRows(result);
    } catch (e) {
      console.error(e);
      toast.error("Could not read that file");
    } finally {
      setParsing(false);
    }
  };

  const valid = rows.filter((r) => r.action !== "skip");
  const creates = valid.filter((r) => r.action === "create");
  const updates = valid.filter((r) => r.action === "update");
  const invalid = rows.filter((r) => r.action === "skip");

  const runImport = async () => {
    if (!valid.length) return;
    setImporting(true);
    setProgress(0);
    let done = 0;
    let ok = 0;
    const failures: string[] = [];

    for (const row of valid) {
      try {
        const payload: Record<string, unknown> = { ...row.values };
        if (row.action === "update") {
          // Never blank out an existing image with the placeholder.
          if (payload.image === PLACEHOLDER_IMAGE) delete payload.image;
          delete payload.slug;
          const { error } = await supabase.from("products").update(payload as any).eq("id", row.existingId!);
          if (error) throw error;
        } else {
          if (!payload.slug) delete payload.slug;
          const { data, error } = await supabase.from("products").insert(payload as any).select("id").single();
          if (error) throw error;
          row.existingId = data.id;
        }

        if (row.categoryIds.length && row.existingId) {
          await supabase.from("product_category_assignments").delete().eq("product_id", row.existingId);
          await supabase.from("product_category_assignments").insert(
            row.categoryIds.map((category_id) => ({ product_id: row.existingId!, category_id })),
          );
        }
        ok++;
      } catch (e: any) {
        failures.push(`Line ${row.line} (${row.values.name}): ${e.message ?? "failed"}`);
      }
      done++;
      setProgress(Math.round((done / valid.length) * 100));
    }

    setImporting(false);
    if (failures.length) {
      console.error("Import failures", failures);
      toast.error(`${ok} imported, ${failures.length} failed. See console for details.`);
    } else {
      toast.success(`${ok} products imported`);
    }
    onImported();
    reset();
    if (!failures.length) setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import / Bulk Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import products from CSV</DialogTitle>
          <DialogDescription>
            Export what you have, edit it in Excel or Sheets, then upload it back. Rows matched by slug (or exact name)
            are updated, everything else is created.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Blank template
          </Button>
          <Button variant="outline" size="sm" onClick={exportCurrent}>
            <Download className="mr-2 h-4 w-4" /> Export current catalog
          </Button>
        </div>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {parsing ? "Reading file..." : fileName || "Click to choose a .csv file"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </label>

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{rows.length} rows read</Badge>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{creates.length} new</Badge>
              <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/15">{updates.length} updates</Badge>
              {invalid.length > 0 && <Badge variant="destructive">{invalid.length} blocked</Badge>}
            </div>

            <div className="border rounded-lg max-h-72 overflow-y-auto text-sm">
              {rows.map((r) => (
                <div key={r.line} className="flex gap-3 items-start px-3 py-2 border-b last:border-0">
                  <span className="text-xs text-muted-foreground w-10 shrink-0 pt-0.5">#{r.line}</span>
                  {r.action === "skip" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : r.action === "update" ? (
                    <RefreshCw className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.values.name || "(no name)"}</p>
                    <p className="text-xs text-muted-foreground">
                      KSh {r.values.price} · stock {r.values.stock} · {r.values.category}
                    </p>
                    {r.errors.map((e, i) => (
                      <p key={i} className="text-xs text-destructive">
                        {e}
                      </p>
                    ))}
                    {r.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-600">
                        {w}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {importing && <Progress value={progress} />}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset} disabled={importing}>
                Clear
              </Button>
              <Button onClick={runImport} disabled={importing || valid.length === 0}>
                {importing ? `Importing ${progress}%` : `Import ${valid.length} rows`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportDialog;
