## Goal

Turn "Special Offers" from bundles-only into a full deals system: bundles + product discounts + flash sales + BOGO, all surfaced through a dedicated **Deals** tab.

---

## 1. Bundle images — admin chooses per bundle

In the Admin bundle form (`src/components/admin/BundlesTab.tsx`), replace the single image-upload field with a **3-mode picker**:

1. **Upload image** (current behavior)
2. **Pick from included products** — dropdown listing `selectedBundleProducts`, click one → its `product.image` becomes the bundle image
3. **Auto-collage** — when no image is set, `BundleCard` renders a 2×2 (or 1/2/3/4-tile) composite from the first 4 product images using CSS grid. No upload needed, computed at render time.

Default for new bundles: **Auto-collage**. Admin can override anytime. Stored as before in `bundles.image` (empty string = auto mode).

Files: `BundlesTab.tsx`, `BundleCard.tsx` (add auto-collage renderer when `image` is empty), `Admin.tsx` (bundle create/edit handlers — allow empty image).

---

## 2. New offer types

### 2a. Single-product discounts (already 80% built)

`products.original_price` already exists and `ProductCard` already shows "Was KSh X". What's missing:
- A **SALE badge** on the card (top-left, red) whenever `originalPrice > price` — shows "-NN%".
- Surface these products in the Deals tab as their own row: "Discounted Products".
- Admin: no schema change needed; the Original Price field already exists. Add a small "= -20% off" hint next to it for clarity.

### 2b. Flash sales (time-limited)

New columns on `products`:
- `sale_starts_at timestamptz null`
- `sale_ends_at timestamptz null`

Logic: a product is "on sale" if `original_price > price` AND (`sale_ends_at` is null OR `now() < sale_ends_at`) AND (`sale_starts_at` is null OR `now() >= sale_starts_at`).

ProductCard shows a **countdown timer** when `sale_ends_at` is within 7 days. Once expired, the front-end hides the strike-through (the DB still has `original_price`, but UI treats it as regular price). Optional nightly cleanup is out of scope.

Admin: 2 new optional date-time inputs in the product form, grouped under a "Flash sale window" toggle.

### 2c. Buy X Get Y free

New table `bogo_offers`:
```
id uuid pk
name text
product_id uuid  -- the qualifying product
buy_quantity int -- e.g. 2
get_quantity int -- e.g. 1 (free)
free_product_id uuid null -- null = same product
is_active boolean
starts_at, ends_at timestamptz null
created_at
```
RLS: public SELECT where `is_active`; admin full CRUD (mirrors bundles).

Cart logic: when computing cart total in `CartContext`, for each active BOGO matching a cart line, deduct `floor(qty / buy_quantity) * get_quantity * unitPrice` from the line subtotal (capped at line total). Show a green "BOGO applied — saved KSh X" line in the cart summary.

Admin: simple "BOGO Offers" sub-tab inside the existing Bundles tab area, or a new tab — recommend a new top-level admin tab "Offers" that contains: Bundles | Flash Sales (filtered product view) | BOGO.

---

## 3. SALE badge on product cards everywhere

In `ProductCard.tsx`, add an absolute-positioned badge inside the image link:
- Red bg, white text, top-left, rounded
- Text: `-{Math.round((1 - price/originalPrice) * 100)}%` when `originalPrice > price`
- If a flash-sale window is active and ending in <24h, show "ENDS SOON" pill below it.

This automatically appears on Home, Category, Students, and Cart-related lists — no per-page change.

---

## 4. Replace "Offers" with a "Deals" bottom-nav tab

Update `src/components/layout/Header.tsx` (mobile bottom nav):
- Rename current Offers entry → **Deals** (icon: `Tag` or `Flame`), route `/deals`.
- Desktop sticky header: same rename.

Rewrite `src/pages/Offers.tsx` → `src/pages/Deals.tsx` (keep `/offers` as a 301-style redirect to `/deals` in `App.tsx` for old links / sitemap stability). New page sections, in order:

1. **Flash Sales** — products with active `sale_ends_at`, sorted by soonest ending, with live countdowns.
2. **Discounted Products** — all products where `original_price > price` (excluding flash-sale items already shown).
3. **Bundle Deals** — current bundle grid.
4. **Buy X Get Y** — BOGO cards (small custom card showing "Buy 2 Get 1 Free" with product image).

Each section is hidden if empty. SEO title/description updated to "Deals & Special Offers".

---

## 5. Memory & cleanup

- Update `mem://features/bundle-offers` with new image modes + new offer types.
- Add `mem://features/deals-system` describing the four offer types and `/deals` route.
- Update navigation memory: Offers → Deals.

---

## Technical summary

**DB migrations**
1. `ALTER TABLE products ADD COLUMN sale_starts_at timestamptz, ADD COLUMN sale_ends_at timestamptz;`
2. `CREATE TABLE bogo_offers (...)` + RLS policies (public read where active, admin all).

**New files**
- `src/pages/Deals.tsx` (replaces Offers.tsx in content)
- `src/components/products/SaleBadge.tsx`
- `src/components/products/CountdownTimer.tsx`
- `src/components/products/BogoCard.tsx`
- `src/components/admin/BogoOffersTab.tsx`

**Edited files**
- `BundleCard.tsx` — auto-collage when no image
- `BundlesTab.tsx` + `Admin.tsx` — 3-mode image picker, allow empty image
- `ProductCard.tsx` — SALE badge + flash-sale awareness
- `Admin.tsx` — add flash-sale date inputs + new "BOGO Offers" admin tab
- `CartContext.tsx` — apply BOGO discounts to totals
- `Header.tsx` — rename Offers → Deals
- `App.tsx` — add `/deals` route, redirect `/offers` → `/deals`
- `scripts/generate-sitemap.ts` — `/deals` instead of `/offers`
- `src/types/product.ts` — add `saleStartsAt`, `saleEndsAt`
- New `src/types/bogo.ts`

**Out of scope (this round)**
- Category-wide discounts (you didn't select it)
- Coupon codes
- Per-user / first-time-buyer offers
- Automated email blasts for flash sales

---

## Open question I'll need before building

You skipped the "biggest pain" question. If there's a specific friction (e.g. "creating bundles is too slow", "I want flash sales to auto-deactivate"), tell me now so I sequence the work accordingly. Otherwise I'll build in the order listed: **bundle images → SALE badges → Deals tab rename → flash sales → BOGO**.
