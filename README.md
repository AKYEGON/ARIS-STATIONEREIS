# ARIS STATIONERIES

**THE HOME OF AFFORDABLE STATIONERIES**

E-commerce website for Aris Stationeries — an online stationery shop serving university students across Kenya. Customers browse products, build bundles, and place orders via WhatsApp checkout.

**Live site:** [arisstationaries.co.ke](https://arisstationaries.co.ke)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The app runs at `http://localhost:8080`.

---

## Project Structure

```
src/
├── pages/                  # Route-level page components
│   ├── Index.tsx           # Homepage — product listing & search
│   ├── Cart.tsx            # Shopping cart & WhatsApp checkout
│   ├── Offers.tsx          # Bundle deals page
│   ├── Testimonials.tsx    # Customer reviews & stories
│   ├── Brochure.tsx        # Printable product catalog
│   ├── Auth.tsx            # Login & signup
│   ├── ResetPassword.tsx   # Password reset
│   ├── Admin.tsx           # Admin dashboard (protected)
│   └── NotFound.tsx        # 404 page
│
├── components/
│   ├── layout/             # Header, Footer, NavLink
│   ├── products/           # ProductCard, BundleCard, OffersSection, MediaViewer
│   ├── cart/               # ProductImageGallery
│   ├── admin/              # Inventory, Sales, Orders, Employee management
│   ├── testimonials/       # Reviews, Stories, Camera capture
│   ├── brochure/           # Printable catalog components
│   ├── common/             # SEO, PullToRefresh
│   └── ui/                 # shadcn/ui primitives (auto-managed)
│
├── contexts/
│   └── CartContext.tsx      # Shopping cart state (localStorage)
│
├── hooks/                   # Custom React hooks
│   ├── use-mobile.tsx       # Mobile viewport detection
│   ├── use-toast.ts         # Toast notifications
│   ├── use-footer-visibility.tsx
│   ├── use-pull-to-refresh.tsx
│   └── use-order-communication.ts
│
├── types/                   # TypeScript interfaces
│   ├── product.ts           # Product, CartItem, ProductVariant
│   ├── bundle.ts            # Bundle, BundleItem
│   ├── testimonial.ts       # CustomerTestimonial
│   └── communication.ts     # Order messaging types & helpers
│
├── data/
│   └── products.ts          # Fallback product data
│
├── integrations/supabase/   # Auto-generated — DO NOT EDIT
│   ├── client.ts
│   └── types.ts
│
├── assets/                  # Images (logo, backgrounds)
├── lib/utils.ts             # Utility functions (cn)
├── index.css                # Global styles & design tokens
└── main.tsx                 # App entry point

supabase/
├── functions/               # Backend functions (auto-deployed)
│   ├── create-order/        # Order processing & stock updates
│   ├── manage-staff/        # Employee management
│   ├── recalculate-profits/ # Profit recalculation
│   └── track-story-view/    # Testimonial view analytics
└── config.toml              # Backend configuration
```

---

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Homepage | Product catalog with search & categories |
| `/cart` | Cart | Shopping cart with WhatsApp checkout |
| `/offers` | Offers | Bundle deals and promotions |
| `/testimonials` | Reviews | Customer stories and reviews |
| `/happy-customers` | Reviews | Alias for `/testimonials` |
| `/brochure` | Catalog | Printable product brochure |
| `/auth` | Auth | Login and signup |
| `/reset-password` | Reset | Password recovery |
| `/admin` | Dashboard | Admin panel (requires admin role) |

---

## Key Features

- **Product Catalog** — Browse by category, search, view product media
- **Shopping Cart** — Add/remove items, quantity controls, localStorage persistence
- **Bundle Deals** — Discounted product bundles
- **WhatsApp Checkout** — Orders sent directly via WhatsApp with full details
- **Customer Reviews** — Instagram-style story format + written reviews
- **Admin Dashboard** — Inventory, sales analytics, order management, employee management
- **Printable Brochure** — Generate a catalog PDF for offline sharing
- **University Selection** — Delivery to specific campuses and pickup outlets

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 + TypeScript | Frontend framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| shadcn/ui | UI component library |
| Lovable Cloud | Backend (database, auth, storage, functions) |
| TanStack Query | Server state & caching |
| React Router v6 | Client-side routing |
| React Hook Form + Zod | Form validation |

---

## Development Notes

- **Do not edit** files in `src/integrations/supabase/` — they are auto-generated
- **Do not edit** `.env` or `supabase/config.toml` — managed automatically
- Each component folder has an `index.ts` barrel export for clean imports
- Design tokens are defined in `src/index.css` and `tailwind.config.ts`
- The admin page requires the `admin` role in the `user_roles` table

---

## Deployment

Built and deployed via [Lovable](https://lovable.dev). Push changes to the repo or edit through the Lovable editor — both sync automatically.
