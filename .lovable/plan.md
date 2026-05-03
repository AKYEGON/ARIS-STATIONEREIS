# Aris Stationeries — Full SEO Build Plan

## ✅ Phase 0 — Quick Wins (DONE)
- Fixed NAP: `+254119774470` / `arisstationeries@gmail.com` in `index.html`
- Installed GA4 (`G-B7XY6KM6N0`) directly in `<head>` (no GTM, no GSC meta — DNS verified)
- Upgraded `index.html` with: LocalBusiness + WebSite + Sitelinks SearchAction + FAQPage JSON-LD, hreflang `en-ke`, `max-image-preview:large`, OG image dimensions
- Upgraded `SEO.tsx`: supports `breadcrumbs`, `noindex`, `ogType="product"`, multi-schema arrays, auto BreadcrumbList JSON-LD
- Per-page titles/descriptions rewritten to match the prompt's keyword patterns (Index, Offers, Testimonials, Cart [noindex], Brochure)
- `robots.txt` now disallows `/cart`, `/checkout`, `/auth`, `/reset-password`, `/admin`
- Sitemap `lastmod` refreshed
- ProductCard already emits Product JSON-LD per card

## 🚧 Phase 1 — Individual Product Pages (HIGH IMPACT)
- Add route `/product/:slug` (slug = derived from product name, e.g. `casio-fx-991es-scientific-calculator-kenya`)
- New page `src/pages/ProductDetail.tsx`:
  - Dynamic H1: `Buy [Name] in Kenya — KSh [Price] | Aris Stationeries`
  - 200-word SEO description block with university keywords (UoN, KU, Strathmore, USIU)
  - H2 sections: Why buy from us / Price in Kenya / Delivery info
  - Breadcrumbs: Home → Category → Product
  - Full Product + Offer + BreadcrumbList JSON-LD via `<SEO>`
  - "You may also like" 4 related products
- Add DB column `slug` on `products` (or compute from name; redirect old IDs)
- Update `ProductCard` to link → `/product/[slug]`
- Sitemap: server-render or build-time generate from products table

## 🚧 Phase 2 — Category Landing Pages
- Route `/category/:slug`
- Page lists products in category + 150-word intro paragraph + breadcrumbs
- Title pattern: `[Category] in Kenya | Affordable [Category] — Aris Stationeries`

## 🚧 Phase 3 — University Landing Pages
- Routes: `/university/uon`, `/kenyatta-university`, `/strathmore`, `/usiu`
- One file `src/pages/UniversityLanding.tsx` driven by config object (campus list, common products, WhatsApp CTA)

## 🚧 Phase 4 — Blog
- Route `/blog` + `/blog/:slug`
- Markdown-based or DB-backed posts
- Seed 5 articles per prompt (UoN guide, calculator comparison, etc.)

## 🚧 Phase 5 — Comparison/Content Pages
- `/guides/best-scientific-calculators-kenya-2025`
- `/guides/cheapest-stationery-near-uon`
- Internal linking to product/category pages

## 🚧 Phase 6 — Local SEO
- `/delivery` page with embedded Google Map + full areas list
- Google Business Profile setup (manual, outside code)

## 🚧 Phase 7 — Dynamic Sitemap
- Edge Function or build script that emits sitemap.xml from `products`, `bundles`, `categories` tables
- Replace static `public/sitemap.xml`

## 🚧 Phase 8 — GA4 Event Tracking
- Wire `add_to_cart`, `begin_checkout`, `purchase`, `search`, `view_item` events to `gtag()` calls in CartContext / Cart.tsx / ProductDetail.tsx

## Notes
- No GSC verification meta tag (DNS verified per user)
- No GTM — direct gtag.js only
- All structured data must validate at https://search.google.com/test/rich-results
