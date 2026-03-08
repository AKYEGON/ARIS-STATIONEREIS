

## Improve Brochure Print Layout

### Goal
Optimize the brochure for cleaner PDF/print output: better page breaks, more products per page, and tighter spacing.

### Changes

**1. `src/index.css` — Print styles overhaul**
- Reduce `@page` margins from 0.8cm to 0.5cm for more usable space
- Remove the `contents` display override that forces grid on row wrappers (causes layout issues)
- Add column-based flow layout rules so products fill pages naturally without awkward gaps

**2. `src/components/brochure/BrochureProduct.tsx` — Compact print card**
- Reduce padding and image size for print via `print:` utilities
- Shrink font sizes further so more cards fit per page
- Use a fixed small height for the image area in print mode instead of aspect-square

**3. `src/pages/Brochure.tsx` — Simplify grid layout**
- Remove the manual row-chunking logic (grouping by 6) which causes incomplete rows and print break issues
- Use a flat grid instead — let CSS handle natural flow and page breaks
- Tighten container padding and gaps for print
- Add `print:page-break-before` on the products section so it always starts on page 2 after the cover

### Technical details

The current row-chunking approach (`reduce` into groups of 6 with `contents` class) creates print layout problems because `contents` display is overridden to `grid` in print CSS, causing each row wrapper to act as its own grid container. Replacing this with a flat product grid lets the browser's native page-break logic work properly, fitting as many cards as possible per page before breaking.

