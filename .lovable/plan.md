## Goal

Shrink the mobile Books experience so the hero "Book of the Week" + reserve action fit in roughly one screen, replace long vertical scrolling with horizontal swipes and a slide-up reservation sheet, and add focused micro-interactions. Desktop stays as-is.

## Problems today (mobile, 390px)

- `/books` stacks editorial header → stats card → big cover → title → synopsis → reservation preview → "Coming Next" grid. Easily 4+ screens of scroll before any action.
- `/books/:slug` is even longer: cover, synopsis pull-quote, logistics strip, payment toggle, name/phone/email, university/branch, pickup/delivery, address + zone, totals, CTA. The CTA only appears after ~5 screens of scroll.
- "Also This Week" uses a 2-col grid that pushes everything else further down.

## Mobile-first redesign

### 1. `/books` — Hero card + horizontal shelf

```text
┌─────────────────────────┐
│ This Week's Read        │  compact header (no big stats card on mobile)
│ Book of the Week        │
├─────────────────────────┤
│ ┌──────┐ Genre chip     │  HERO CARD (fits in viewport)
│ │      │ Title (serif)  │  - cover left, meta right
│ │ COV  │ by Author      │  - countdown + slots inline
│ │ ER   │ ⏱ 2d 4h · 12/30│
│ │      │ [Reserve →]    │  primary CTA visible above fold
│ └──────┘ swipe for more │
├─────────────────────────┤
│ ● ○ ○   (page dots)     │  swipeable carousel of open books
├─────────────────────────┤
│ Coming up                │  horizontal-scroll thumb rail
│ [📕][📗][📘][📙] →       │  snap-scroll, no 2-col grid
└─────────────────────────┘
```

- Replace the stacked hero with a single swipeable card carousel (one open book per slide). Native horizontal snap-scroll, page dots, optional drag with momentum.
- Move countdown + slots into the hero card itself — kill the separate stats card on mobile.
- Replace the "Also This Week" 2-col grid with a horizontal snap rail of cover thumbnails (similar to existing testimonials story rail). Tap a thumbnail to swap the hero, long-press or arrow opens detail.
- Sticky bottom "My reservations" link folded into the existing mobile tab bar context; remove the trailing centered link.
- Desktop layout untouched (`md:` breakpoints preserve current grid).

### 2. `/books/:slug` — Sticky hero + bottom sheet reservation

```text
┌─────────────────────────┐
│ ← The Shelf             │
│ ┌─────────────────────┐ │  Compact hero (collapses on scroll)
│ │   COVER (smaller)   │ │  - aspect 4:5 instead of 3:4
│ │                     │ │  - title overlay on image
│ └─────────────────────┘ │
│ Genre · ⏱ 2d · 12 left  │  one-line meta strip
│ Synopsis (3 lines,      │  expandable "Read more"
│  tap to expand) …       │
├─────────────────────────┤
│ ┃ Sticky bottom bar:    │  always visible
│ ┃ KSh 200 deposit       │
│ ┃ [Reserve Your Copy →] │  opens bottom sheet
└─────────────────────────┘
```

Bottom sheet (slides up, dismissible):

- Step 1 — Plan: deposit vs full (2 large pills).
- Step 2 — You: name, phone (autofocus, tel keypad), email optional.
- Step 3 — Handover: pickup ↔ delivery segmented toggle; university + branch always; conditional outlet OR address+zone.
- Step 4 — Review + Confirm: amount + balance summary, big confirm button.

Each step is a single short screen inside the sheet with a progress dot row at the top and a back chevron. Sheet height ~85vh so the cover peeks behind (context preserved). Swipe-down to dismiss.

### 3. Micro-interactions

- Framer-motion entrance: cover scales from 0.96 → 1 with a soft shadow lift on mount.
- Carousel: spring snap, page dots morph with active index.
- Slot bar: animated fill on first paint; pulses red when ≤5 left.
- Countdown: last 60 minutes flips to red + subtle tick animation.
- Reserve CTA: long-press shows a tooltip "Locks your copy for 24h".
- Haptic-style feedback via `navigator.vibrate(10)` on step transitions in the sheet (mobile only).
- Sheet open/close: spring 280ms with backdrop blur fade.

### 4. Responsive guardrails

- All new layout wrapped in `md:hidden` / `hidden md:block` pairs so desktop keeps its current editorial grid.
- Touch targets ≥44px, font scale ≥14px body / ≥12px meta.
- Test viewports: 320, 360, 390, 414, 768. Header + bottom tab bar must not overlap sticky reserve bar (`pb-[env(safe-area-inset-bottom)]` + extra padding for tab bar).
- `prefers-reduced-motion` disables carousel auto-snap easing and sheet spring.

## Technical notes

- New components:
  - `src/components/books/BookHeroCarousel.tsx` — horizontal snap carousel for `/books` (mobile only).
  - `src/components/books/BookThumbRail.tsx` — horizontal snap rail replacing the grid on mobile.
  - `src/components/books/ReserveSheet.tsx` — bottom sheet wrapper using shadcn `Drawer` (vaul) with internal step state.
  - `src/components/books/StickyReserveBar.tsx` — fixed bottom bar on `/books/:slug` (mobile).
- Existing `BookDetail.tsx` form logic stays; the form is moved into `ReserveSheet` step components without changing state, validation, or the `reserve_book_slot` RPC call.
- `Books.tsx` keeps the desktop `FeaturedBook` + grid path; mobile branch renders the carousel + rail.
- Use `framer-motion` (already installed via existing components) for spring/scale/fade.
- Reuse design tokens; no new color classes.

## Out of scope

- No backend/schema changes.
- No copy rewrites beyond what's needed for step labels in the sheet.
- Desktop layout untouched.

## Open questions before I build

1. On the mobile hero carousel, should the **first slide always be the newest open book**, or do you want the user to be able to pin a favourite?
2. For the reservation **bottom sheet**, do you prefer the 4-step wizard (one screen at a time, very short) or a single scrollable sheet with all fields visible (faster for repeat users)?
3. The "Coming up" rail — should **sold-out / handover-pending books still appear** there, or hide them on mobile to keep it short?
