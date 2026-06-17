---
name: SEO Phase 1+3 Identity Bridge & On-Page Templates
description: Brand consolidates as "ARIS Stationeries" with alternateName JSON-LD bridging stationaries↔stationery spellings; locked title formulas per page type
type: feature
---

## Brand identity (index.html JSON-LD)

- LocalBusiness + WebSite schemas: `name: "ARIS Stationeries"`, `alternateName: ["Aris Stationeries","Aris Stationaries","ARIS Stationaries","Arisstationaries","Aris Stationery","Aris Stationery Nairobi"]`.
- Purpose: bridges branded-search split between misspelled domain (`stationaries`) and correct English (`stationery/stationeries`).
- Product schema brand & seller use `ARIS Stationeries` (mixed-case, not ALL CAPS).

## Locked title formulas (Phase 3)

- Homepage: `ARIS Stationeries Nairobi | Buy Stationery Online in Kenya`
- Category (`/category/:slug`): `{Category} in Kenya — Buy Online | ARIS Stationeries` (fallback auto-appends suffix; per-slug COPY overrides allowed)
- Product (`/product/:slug`): `{Name} — KSh {price} | Price in Kenya | ARIS Stationeries` (sliced to 70 chars)
- Deals (`/deals`): `Stationery Deals in Kenya — Flash Sales & Bundles | ARIS Stationeries`
- Students hub (`/students`):
  - Course view: `{Course} Stationery List — Nairobi Universities | ARIS Stationeries`
  - Faculty view: `{Faculty} Stationery — Course Lists | ARIS Stationeries Nairobi`
  - Root view: `Shop Stationery by Course — UoN, KU, Strathmore, JKUAT | ARIS Stationeries`

## H1 rule

Every indexable page must have a single H1. Homepage uses `sr-only` H1 ("ARIS Stationeries Nairobi — Buy Stationery Online in Kenya") because the visual hero was removed.

## Do not deviate

- Always spell "Stationery"/"Stationeries" correctly in copy, meta, schema, alts. Domain alone keeps the misspelling.
- Never use ALL-CAPS brand string in schema name/seller (use `ARIS Stationeries`).
