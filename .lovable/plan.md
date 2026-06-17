# Review Collection System

## Existing System Audit (what's already built — don't break it)

| Asset | Current behavior | Plan's impact |
|---|---|---|
| `customer_testimonials` table | Sitewide brand reviews, no product_id/order_id; columns: name, photo, product_name (text), review_text, rating, video_url, is_published, views… | **Extend additively** — add product_id, order_id, review_request_id, is_verified_purchase, phone. Existing rows unaffected (all nullable). |
| RLS | Anon can INSERT only when `is_published=false`; public SELECT only when `is_published=true` | **Keep as-is.** Token submissions go through edge fn (service role) so RLS for anon stays restrictive. |
| `/testimonials` page | Public, IG-style stories carousel; submission form with `?review=true&name=&phone=&product=` prefill | **Keep unchanged.** Stays the sitewide brand-trust page. |
| `ReviewSubmissionForm` | Star rating, photo, video (camera capture), prefill via URL params | **Reuse as-is.** New `/review/:token` route resolves token then renders this same form with extra hidden product_id/order_id/token. |
| `use-order-communication.ts` | Admin "Send Review Request" builds `?review=true&name=&phone=` WhatsApp link, sent manually from order panel | **Upgrade in place** — same button, same WhatsApp UX, but link becomes `/review/{token}` and SMS is sent in parallel. |
| StoriesCarousel / StoryCircles / FeaturedTestimonial | Reads `customer_testimonials` where `is_published=true` | **Keep showing all** (sitewide social proof). No product filter. |
| Admin Testimonials tab | Filter all/pending/published, photo/video upload | **Extend** — add per-product filter, verified-purchase badge column, review-request funnel view. |
| Existing 4 approved testimonials | Sitewide, no product link | **Stay sitewide.** Per-product schema activates only once product reviews accumulate. |

## Architecture

```
order.status flips → delivered | picked_up
        ↓
Trigger: enqueue_review_dispatch (pg_net → edge fn, once per order)
        ↓
Edge fn: dispatch-review-requests
  • For each distinct product in order_items → INSERT review_requests row
  • Build /review/{token} URL (30-day expiry)
        ↓
  ┌─── WhatsApp link (wa.me, admin clicks Send) ───┐
  └─── SMS via Africa's Talking (auto-send) ───────┘
        ↓
Customer taps → /review/:token → token resolver loads context
        ↓
  Renders existing ReviewSubmissionForm + hidden product_id/order_id/token
        ↓
Edge fn: submit-review (validates token, inserts testimonial with
         is_verified_purchase=true, is_published=false, marks token used)
        ↓
Admin moderates in existing Testimonials tab → is_published=true
        ↓
ProductDetail injects aggregateRating + review schema when ≥3 approved
```

## Phase 1 — Schema migration

**Extend `order_items`:** add `product_id uuid REFERENCES products(id)`. Backfill via name match (best-effort).

**Extend `customer_testimonials`:** add `product_id`, `order_id`, `review_request_id`, `is_verified_purchase boolean DEFAULT false`, `customer_phone text`. Unique partial index on `(order_id, product_id) WHERE order_id IS NOT NULL`.

**New table `review_requests`:** token (text unique, 32-char nanoid), order_id, product_id, order_item_id, customer_name, customer_phone, channels_sent text[], sent_at, used_at, expires_at (default now() + 30d). RLS: anon SELECT by token only (single row); service_role full.

**New trigger** on `orders`: after UPDATE, if status changes to `delivered`/`picked_up` (case-insensitive) AND no existing requests for this order → pg_net call to `dispatch-review-requests`.

## Phase 2 — Edge functions

| Function | Auth | Purpose |
|---|---|---|
| `dispatch-review-requests` | service-role (called by trigger) | Create review_requests rows, send SMS via Africa's Talking, return WhatsApp links |
| `resolve-review-token` | public | GET token → returns name, phone, product info (no PII leak — token-gated) |
| `submit-review` | public | POST {token, rating, text, photo} → validates, inserts, marks used. Length limits + photo MIME check |

## Phase 3 — Customer-facing route

**`/review/:token`** — new lightweight page:
- Calls `resolve-review-token` → shows product card + "How was your {productName}?"
- Renders `ReviewSubmissionForm` (existing component) with `prefillData` + hidden `productId`/`orderId`/`token`
- Submit calls `submit-review` edge fn (not direct insert)
- States: valid / expired / already-used / invalid

## Phase 4 — ProductDetail integration (the SEO payoff)

- Fetch `customer_testimonials WHERE product_id = X AND is_published=true ORDER BY created_at DESC LIMIT 20`
- New "Customer Reviews" section: avg-star header, individual cards with verified-purchase badge
- Inject schema **only when count ≥ 3**:
  - `aggregateRating { ratingValue, reviewCount }`
  - `review[]` (up to 5 most recent: author, rating, text, datePublished)

## Phase 5 — Admin enhancements

- Testimonials tab: add per-product filter dropdown, "verified purchase only" toggle, badge column
- New section "Review request funnel": sent → opened → completed counts, list of unanswered requests with "Resend after 7 days" action
- Order panel: existing "Send Review Request" button now reads from `review_requests` table (links per product item instead of one generic link)

## Phase 6 — SMS provider setup (one-time)

**Africa's Talking** chosen — Kenya-native, cheapest for KE numbers (~KSh 0.80/SMS), supports sender ID. User signs up at africastalking.com, gets username + API key, I store as `AFRICASTALKING_USERNAME` + `AFRICASTALKING_API_KEY` secrets. Sandbox mode for testing.

## Decisions confirmed
- ✅ Triggers: `delivered` AND `picked_up`
- ✅ Channels: WhatsApp (manual send, existing UX) + SMS (auto)
- ✅ No incentives — pure ask. (Can layer 5% coupon later without schema change.)

## Out of scope
- Email channel (no emails captured)
- Quick Sales/walk-ins without phone — no auto-request
- Review reply/dispute flow, helpfulness voting, AI photo moderation
- WhatsApp Business API auto-send (admin click stays for now)

## One remaining question
**Confirm SMS provider:** Africa's Talking (recommended, Kenya-native) — yes/no? If yes, you'll need an account before Phase 6 can ship.
