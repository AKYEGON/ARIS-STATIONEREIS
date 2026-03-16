

# Improve Footer & Fix Build Error

## Issues Identified

1. **Build error**: `NodeJS.Timeout` type in `OffersSection.tsx` line 17 — needs to use `ReturnType<typeof setInterval>` instead.

2. **Footer page transition issue**: When navigating between pages, the scroll position isn't reset, so users land mid-page or at the footer instead of the top. There's no scroll-to-top on route change.

3. **Footer overlap on mobile**: The footer can get partially hidden behind the bottom navigation bar on some pages.

## Plan

### 1. Fix build error in OffersSection.tsx
- Change `NodeJS.Timeout` to `ReturnType<typeof setInterval>` on line 17.

### 2. Add scroll-to-top on route change
- Create a `ScrollToTop` component in `src/components/common/` that uses `useLocation` from react-router and scrolls to top on pathname change.
- Add it inside `BrowserRouter` in `App.tsx`.

### 3. Ensure footer isn't hidden behind mobile nav
- Verify all pages have `pb-16 md:pb-0` on their wrapper div (some already do — will check and fix any missing ones like Brochure, Testimonials, Cart).

### Files to modify
- `src/components/products/OffersSection.tsx` — fix TypeScript error
- `src/components/common/ScrollToTop.tsx` — new component
- `src/App.tsx` — add ScrollToTop
- Any pages missing bottom padding for mobile nav

