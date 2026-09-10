# SEO and AI-discoverability upgrade

## First: what do we do?

One sentence, used everywhere (title tags, schema, llms.txt, AI answers):

> ARIS is a Nairobi-based stationery and course-equipment shop for Kenyan university and college students: drawing sets, scientific calculators, notebooks, lab and engineering kits, plus school-list quoting, with same-day Nairobi delivery, countrywide delivery, M-Pesa payment and UoN pickup.

Longer version for the About page and AI crawlers:

> ARIS supplies the exact stationery and equipment Kenyan students are asked to bring for their course. Shop by course or category, get a quote from a photo of your school list, order on the site or on WhatsApp (+254 119 774470), pay with M-Pesa or card, collect at UoN or get it delivered same day in Nairobi and countrywide.

Everything below is written to make that answer the one Google and AI assistants repeat back.

## Decisions locked in

- Canonical address stays **www.arisstationaries.co.ke**.
- No new content pages for now; existing pages get deeper.
- Move to server-rendering so crawlers and AI models see real page content.

## Phase 1 - Server-rendering (the big unlock)

Today every page is assembled in the visitor's browser. Google mostly copes; most AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Bytespider) and social preview bots do not. They fetch an empty shell, so product names, prices and descriptions are invisible to them.

- Migrate the app to Lovable's server-rendered template (TanStack Start). Every route ships finished HTML: title, description, canonical, product price, stock and description all present on first byte. [What the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start)
- Move the per-page head tags from the current client-side setup to server-rendered head tags, keeping the exact same titles, descriptions, canonicals and JSON-LD.
- After migration, re-verify a product page, a category page and the homepage with a raw fetch (no JavaScript) to confirm the content is really there.

This is a structural change and the largest piece of work in the plan; the phases below are much smaller and can also land before it.

## Phase 2 - Make AI models cite us

- Add `/llms.txt`: the "what we do" statement above plus a clean link list to Home, Shop, Deals, Testimonials, School List, About, Contact, Returns, and the main category pages.
- Add `/llms-full.txt`: a generated, plain-text catalogue snapshot (category, product name, price in KES, availability, short description, URL) so an assistant can answer "does ARIS sell a Casio fx-991?" without crawling hundreds of pages. Regenerated with the sitemap.
- Extend `robots.txt` with explicit allow blocks for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, plus a pointer to both llms files.
- Add a public product feed at `/feed.xml` (Google Merchant / RSS style) so Merchant Center, price comparison bots and AI shopping agents pull structured prices directly.

## Phase 3 - Sharpen the entity ("who is ARIS")

- Fix the schema split: `index.html` says `LocalBusiness` while the homepage component emits a second `WebSite` block on a different URL (`arisstationaries.co.ke` without www, `/shop?q=`). Consolidate to one `Organization` plus one `WebSite` node, both on the www domain, correctly linked with `@id`.
- Add `Store`/`OnlineStore` typing with `hasOfferCatalog` listing the main categories, `paymentAccepted` (M-Pesa, card, cash), `areaServed`, opening hours and delivery terms.
- Add `Service`-style markup for the school list quoting flow so it can be found as its own capability.
- Keep `AggregateRating` and reviews on products, and add sitewide review markup on the testimonials page.

## Phase 4 - Page-level depth on what already exists

- Rewrite title and description formulas per page type so each one leads with the job the page does, not just a keyword string. Category pages get an intro paragraph (150-250 words) describing what the category covers and who buys it, followed by the product grid.
- Product pages: ensure a real, unique description (fall back to a generated one where the field is blank), specifications table, "commonly bought for" course hints, and internal links to sibling products and the parent category.
- Add an FAQ block, visible on the page and mirrored in markup, to the homepage, the school list page and each main category, answering delivery, payment, pickup and price questions in plain language.
- Fix image alt text sitewide to describe the product, brand and use case.
- Add breadcrumb navigation visibly on category and product pages, matching the existing breadcrumb markup.

## Phase 5 - Technical hygiene and measurement

- Sitemap: split into an index with separate product, category and page sitemaps; drop non-indexable routes (`/cart`, `/auth`, `/admin`, `/reset-password`, `/brochure`, `/students`) that are currently listed while also being blocked in robots.txt.
- Redirects: confirm non-www and bare `http` both 301 to the canonical www https address; make sure the retired routes (`/students`, `/offers`, `/happy-customers`, `/brochure`) return real 301s rather than client-side redirects.
- Performance: preload the hero image, lazy-load below-the-fold imagery, and confirm mobile Core Web Vitals on a real product page.
- Verify Search Console and Bing Webmaster Tools, submit the new sitemap index, and re-run the SEO review to confirm each item.

## Technical notes

- Files touched: `index.html`, `src/components/common/SEO.tsx`, `src/pages/Index.tsx`, `ProductDetail.tsx`, `CategoryLanding.tsx`, `SubcategoryLanding.tsx`, `Shop.tsx`, `LegalPage.tsx`, `public/robots.txt`, `scripts/generate-sitemap.ts`, plus new `public/llms.txt`, generated `llms-full.txt` and `feed.xml` written by the sitemap script from Lovable Cloud data.
- The llms-full and feed generators reuse the existing build-time Supabase fetch in `scripts/generate-sitemap.ts`, so they stay in sync with the live catalogue on every deploy.
- The TanStack migration is run as its own step and verified route by route before the content work builds on top of it.

## Suggested order

1. Phase 2 and 3 (fast, high leverage, no structural risk)
2. Phase 5 hygiene
3. Phase 1 server-rendering migration
4. Phase 4 content depth on the server-rendered pages
