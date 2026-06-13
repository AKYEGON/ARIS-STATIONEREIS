## Problem

In the homepage "Special Offers" marquee, the flash-sale ProductCards (e.g. BIC FINE POINT, EXAM CHAPCHAP, CRYSTAL BIC PEN) show a huge empty gap between the product name and the price/Add button.

## Root cause

All three card components (`ProductCard`, `BogoCard`, `BundleCard`) use `h-full` + `flex-1` on their content area. The marquee in `OffersSection.tsx` is a flex row that defaults to `align-items: stretch`, so every card grows to match the tallest sibling — usually the BOGO card, which has an extra "Buy 1, get 2 × … free" description line and a `~KSh each` line. The flash-sale cards have less content, so `flex-1` pads out the gap with empty space.

## Fix (single, surgical change)

In `src/components/products/OffersSection.tsx`, change the marquee row to `items-start` and drop the per-item `h-full` stretch:

- On the inner marquee `<div className="flex gap-2 md:gap-4 w-max …">` add `items-start`.
- This lets every card size to its own content, eliminating the whitespace inside shorter cards.

The cards will no longer be the same height, but visually they will stay aligned by the top edge (image), which matches the inspiration screenshots and removes the empty band.

No changes to BogoCard / ProductCard / BundleCard internals, no business-logic changes.

## Files to edit

- `src/components/products/OffersSection.tsx` — add `items-start` to the marquee flex row.
