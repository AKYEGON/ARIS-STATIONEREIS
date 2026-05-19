## Problem

In the Admin product form (Add and Edit), "Current Price" and "Cost Price" are marked required (`*`) and validated. When a product has variants (each with its own price/cost), filling those top-level fields is meaningless busywork and blocks saving.

## Solution

Make the top-level **Current Price** and **Cost Price** auto-derived (and optional) when variants exist.

### Behavior

- If `variants.length > 0`:
  - Labels change from "Current Price *" / "Cost Price *" → "Current Price (from variants)" / "Cost Price (from variants)"
  - Fields become **disabled** and auto-show the **lowest variant price** and **lowest variant cost** (so listings still display a sensible "from" price)
  - Validation no longer requires them
  - On save, `price` = min variant price, `cost_price` = min variant cost
- If no variants: behavior unchanged — both fields required as today.

### Files to change

- `src/pages/Admin.tsx`
  - Add (Create) form (~line 1746, 1766): conditional label, `disabled`, auto-filled value
  - Edit form (~line 2690, 2710): same treatment
  - `handleAddProduct` validation (line 833) and payload (line 862-864): if variants exist, skip price requirement and compute min price/cost from `variants`
  - `handleEditProduct` validation (line 956) and payload (line 976-978): same

### Out of scope

- ProductCard/ProductDetail display logic (already uses variant price when selected — no change needed)
- Variant manager UI itself
- Database schema (price/cost stay non-null; we just compute them from variants)

### Notes

Auto-syncing the parent `price` to `min(variants.price)` keeps shop listings, cart totals (when no variant selected), and existing sort/filter logic working with zero downstream changes.
