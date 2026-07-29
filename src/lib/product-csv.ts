export interface ParsedProductRow {
  name: string;
  description: string;
  category: string;
  price: number;
  original_price: number | null;
  cost_price: number | null;
  stock: number;
  image: string;
}

/** RFC4180-ish CSV parser: handles quoted cells, escaped quotes and newlines inside quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];

    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const normalise = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  productname: "name",
  description: "description",
  category: "category",
  price: "price",
  sellingprice: "price",
  originalprice: "original_price",
  costprice: "cost_price",
  cost: "cost_price",
  stock: "stock",
  quantity: "stock",
  image: "image",
  imageurl: "image",
};

const toNumber = (v: string | undefined): number | null => {
  if (v === undefined) return null;
  const cleaned = v.replace(/[^0-9.\-]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

export interface ProductCSVResult {
  rows: ParsedProductRow[];
  errors: string[];
}

/** Parses the CSV produced by the admin "Export CSV" button back into product rows. */
export function parseProductsCSV(text: string): ProductCSVResult {
  const table = parseCSV(text);
  const errors: string[] = [];

  if (table.length < 2) {
    return { rows: [], errors: ["The file is empty or has no data rows."] };
  }

  const headerRow = table[0].map((h) => HEADER_ALIASES[normalise(h)] ?? normalise(h));
  const idx = (key: string) => headerRow.indexOf(key);

  if (idx("name") === -1 || idx("price") === -1) {
    return {
      rows: [],
      errors: ['Missing required columns. The file needs at least "Name" and "Price" headers (as produced by Export CSV).'],
    };
  }

  const rows: ParsedProductRow[] = [];

  table.slice(1).forEach((cells, i) => {
    const lineNo = i + 2;
    const get = (key: string) => {
      const at = idx(key);
      return at === -1 ? "" : (cells[at] ?? "").trim();
    };

    const name = get("name");
    if (!name) {
      errors.push(`Row ${lineNo}: missing product name, skipped.`);
      return;
    }

    const price = toNumber(get("price"));
    if (price === null || price < 0) {
      errors.push(`Row ${lineNo} (${name}): invalid price, skipped.`);
      return;
    }

    rows.push({
      name,
      description: get("description"),
      category: get("category") || "General",
      price,
      original_price: toNumber(get("original_price")),
      cost_price: toNumber(get("cost_price")),
      stock: toNumber(get("stock")) ?? 0,
      image: get("image"),
    });
  });

  return { rows, errors };
}
