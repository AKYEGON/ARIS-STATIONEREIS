## Goal
Make every search box on the site behave "smartly" — tolerant of extra whitespace, word order, casing, accents, punctuation, and partial words — using one shared helper so behaviour stays consistent.

## What "smart search" will do
1. **Normalize** both query and target: lowercase, strip diacritics (`é → e`), collapse all whitespace (incl. tabs/non-breaking spaces), trim, treat punctuation (`-`, `_`, `/`, `.`, `,`) as spaces.
2. **Tokenize** the query into words. A row matches when **every token** appears somewhere in the combined searchable text (AND logic, any order). So `"blue   pen A4"` matches "A4 Blue Pen".
3. **Partial match** per token (substring) so `"calc"` finds "Calculator".
4. **Multi-field** match: each item exposes a list of fields (name, category, description, tags, SKU, phone, etc.) joined into one haystack.
5. **Optional fuzzy fallback**: if no exact-token match, allow 1-character typo tolerance on tokens ≥4 chars (lightweight Levenshtein, no dependency). Off by default per call; on for product/customer search.
6. **Highlight helper** (optional, opt-in): returns matched ranges so we can later bold matches in results — not wired into UI in this pass unless trivial.

## New shared helper
`src/lib/smart-search.ts`
- `normalize(text: string): string`
- `tokenize(query: string): string[]`
- `smartMatch(query: string, fields: (string | null | undefined)[], opts?: { fuzzy?: boolean }): boolean`
- `smartFilter<T>(items: T[], query: string, getFields: (item: T) => (string|null|undefined)[], opts?): T[]`

Zero new dependencies.

## Rollout — replace existing `.toLowerCase().includes(...)` filters

Public:
- `src/pages/Index.tsx` — product search (name, description, category)
- `src/pages/Students.tsx` — faculty/course/product search
- `src/pages/Testimonials.tsx` — if a search exists
- `src/pages/CategoryLanding.tsx`, `src/pages/Offers.tsx`, `src/pages/Cart.tsx` — only if they currently have search

Admin:
- `src/pages/Admin.tsx` — products tab (name/category/description), orders tab (id/name/email/phone/status/tags), testimonials tab (name/product/review)
- `src/components/admin/InventoryDashboard.tsx` — product search
- `src/components/admin/QuickSaleDialog.tsx` — product search
- `src/components/admin/ProductCoursesDialog.tsx` — faculty/course search
- `src/components/admin/ApplyYearTemplateDialog.tsx` — faculty/course search

Behaviour upgrades vs today:
- Extra spaces between words no longer break matches.
- Word order no longer matters (`"pen blue"` == `"blue pen"`).
- Diacritics/accents ignored.
- Punctuation in product names (`A4-200pg`) searchable as `"a4 200"`.
- Fuzzy on for products + orders so `"calcualtor"` still finds "Calculator".

## Out of scope
- Server-side full-text search (Postgres `tsvector`) — not needed at current data sizes; can revisit later.
- Visual highlighting of matched terms in result lists.
- Adding new search inputs to pages that don't have one.
- Synonym dictionary (e.g. "biro" → "pen").

## Technical notes
- Pure client-side; existing data is already loaded into memory for each search context.
- Helper is stateless and tree-shakeable.
- Memoize haystacks inside `useMemo` filter blocks to keep perf identical to today.
- Levenshtein implementation capped at distance 1 and length ≥4 so cost stays O(n·m) on short strings only.
