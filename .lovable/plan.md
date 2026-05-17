# Starting Phase 2 — Category Landing Pages + Dynamic Sitemap

Phase 0 (technical foundations) and Phase 1 (product detail pages) are already shipped. The next biggest ranking unlock is **category hub pages** so Google can rank you for head terms like *"notebooks Kenya"*, *"scientific calculators Nairobi"*, *"drawing sets Kenya"* — which today have no dedicated page.

## What gets built in this slice

### 1. Category landing pages — `/category/:slug`
- New route in `src/App.tsx`
- New page `src/pages/CategoryLanding.tsx`:
  - Fetches category by slug + all its products from Supabase
  - H1: `[Category Name] in Kenya — Buy Online | Aris Stationeries`
  - 150-word SEO intro paragraph (category-specific, mentions price range, common buyers, universities served)
  - Breadcrumbs: Home → [Category]
  - Grid of `ProductCard` for every product in the category
  - "Browse other categories" links at the bottom (internal-link juice)
- SEO via existing `<SEO>` component:
  - `CollectionPage` + `BreadcrumbList` + `ItemList` JSON-LD
  - Per-page title/description/canonical

### 2. Link categories from existing UI
- `ProductCard` category badge → links to `/category/[slug]`
- `CategoryRotator` chips on homepage → also link to `/category/[slug]` (in addition to filtering)
- Footer: add "Shop by Category" column listing top 6 categories

### 3. Dynamic sitemap generator
Replace the static `public/sitemap.xml` (currently 100+ hand-listed URLs) with a build-time generator:
- `scripts/generate-sitemap.ts` — fetches products + categories from Supabase via the anon client
- Wired to `predev` + `prebuild` in `package.json`
- Auto-includes: `/`, `/offers`, `/testimonials`, `/students`, every `/product/:slug`, every `/category/:slug`
- Fresh `lastmod` on every deploy

## Database changes
- One migration: add `slug` column to `categories` (text, unique, not null) with a trigger that auto-fills from `name` on insert/update — same pattern as the existing `products.slug` trigger from Phase 1.
- Backfill existing rows.

## Out of scope for this slice
- University landing pages → next slice
- GA4 conversion events → next slice
- Blog, comparison guides, GBP → later phases

## Order of operations
1. Run the `categories.slug` migration
2. Build `CategoryLanding.tsx` + route
3. Wire up internal links (ProductCard, CategoryRotator, Footer)
4. Convert sitemap to dynamic generator
5. Verify: visit `/category/notebooks`, check page renders + view-source shows JSON-LD + sitemap.xml lists the new URLs

Reply **"go"** to proceed.
