/**
 * Smart search utilities - tolerant of whitespace, casing, diacritics,
 * punctuation, word order, partials, and (optionally) 1-char typos.
 */

export function normalize(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[\s\-_/.,;:!?()[\]{}'"`~@#$%^&*+=|\\<>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(query: string): string[] {
  const n = normalize(query);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

/** Levenshtein distance with early-exit cap. */
function levenshteinLE(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

function tokenMatches(token: string, haystack: string, fuzzy: boolean): boolean {
  if (!token) return true;
  if (haystack.includes(token)) return true;
  if (!fuzzy || token.length < 4) return false;
  // Try fuzzy against each word in the haystack
  const words = haystack.split(" ");
  for (const w of words) {
    if (Math.abs(w.length - token.length) > 1) continue;
    if (levenshteinLE(token, w, 1) <= 1) return true;
  }
  return false;
}

export interface SmartMatchOptions {
  fuzzy?: boolean;
}

export function buildHaystack(fields: (string | null | undefined)[]): string {
  return normalize(fields.filter(Boolean).join(" "));
}

export function smartMatch(
  query: string,
  fields: (string | null | undefined)[],
  opts: SmartMatchOptions = {}
): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const haystack = buildHaystack(fields);
  if (!haystack) return false;
  for (const t of tokens) {
    if (!tokenMatches(t, haystack, !!opts.fuzzy)) return false;
  }
  return true;
}

export function smartFilter<T>(
  items: T[],
  query: string,
  getFields: (item: T) => (string | null | undefined)[],
  opts: SmartMatchOptions = {}
): T[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return items;
  const fuzzy = !!opts.fuzzy;
  return items.filter((item) => {
    const haystack = buildHaystack(getFields(item));
    if (!haystack) return false;
    for (const t of tokens) {
      if (!tokenMatches(t, haystack, fuzzy)) return false;
    }
    return true;
  });
}
