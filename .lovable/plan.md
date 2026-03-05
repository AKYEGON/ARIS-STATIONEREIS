

## Navigation Redesign: Public Storefront

The goal is to replace the current hamburger menu + floating cart button on mobile with a fixed **bottom tab bar**, while keeping the desktop header clean with inline links. The tablet view will get a hybrid approach.

### Current State
- **Mobile**: Sticky header with hamburger menu (Sheet) + floating cart FAB
- **Desktop**: Sticky header with inline button links (Offers, Happy Customers, Brochure, Cart)
- Admin panel navigation is untouched (stays as-is)

### Plan

#### 1. Mobile Bottom Tab Bar (replaces hamburger + floating cart)
- Fixed bottom bar with 5 tabs: **Shop**, **Offers**, **Customers**, **Brochure**, **Cart** (with badge)
- Active tab highlighted with primary color (icon + label)
- Compact icons with small labels beneath
- Hides when footer is visible (reuse existing `useFooterVisibility` hook)
- Remove: hamburger menu button, Sheet component, floating cart FAB

#### 2. Desktop Header (minor cleanup)
- Keep current sticky header with inline nav links
- No structural changes needed, just remove mobile-only elements cleanly

#### 3. Tablet View (md breakpoint, 768px-1024px)
- Use the **desktop header** layout (inline links) since there are only 4-5 nav items and they fit comfortably
- No bottom bar on tablet

### Files to Change

| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Remove hamburger Sheet, floating cart FAB. Add bottom tab bar for mobile (`md:hidden`). Keep desktop nav as-is. |
| `src/components/layout/index.ts` | No change needed |

### Bottom Bar Design
- White/background fill, top border, subtle shadow
- 5 evenly spaced items, each with icon (20px) + label (10px text)
- Cart tab shows badge count
- Uses `NavLink` or `useLocation` to highlight active route
- Safe area padding for notched phones (`pb-safe` / env(safe-area-inset-bottom))

