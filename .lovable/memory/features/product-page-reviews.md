---
name: Product Page Reviews (Phase 4)
description: Customer reviews section on /product/:slug with aggregateRating + review JSON-LD for Google rich snippets
type: feature
---
## Component
`src/components/products/ProductReviews.tsx` — fetches `customer_testimonials` where `product_id = <id>` AND `is_published = true`, sorted by `created_at DESC`. Shows average stars, count, per-review cards (avatar, stars, verified badge, text, optional video). Empty state when no reviews. Calls `onLoaded` so parent can hydrate JSON-LD.

## SEO schema
`ProductDetail.tsx` injects `aggregateRating` + `review[]` into existing Product JSON-LD ONLY when 3+ approved rated reviews exist (Google rich-snippet threshold). Up to 10 reviews included in schema.

## Submission flow (unchanged)
Reviews still arrive via `/review/:token` → `submit_review_by_token` RPC → `is_published = false` → staff approve in existing Testimonials admin. Approved reviews auto-appear on matching product page (linked via `customer_testimonials.product_id`).
