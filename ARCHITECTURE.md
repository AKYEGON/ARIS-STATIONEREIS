# ARIS STATIONERIES - Project Architecture

## Overview

E-commerce website for ARIS STATIONERIES built with React, TypeScript, Vite, Tailwind CSS, and Supabase (via Lovable Cloud).

**Production URL**: https://arisstationaries.co.ke  
**Tagline**: THE HOME OF AFFORDABLE STATIONERIES

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | Frontend UI framework |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Pre-built UI components |
| Supabase | Backend (database, auth, storage, edge functions) |
| TanStack Query | Server state management |
| React Router v6 | Client-side routing |
| React Hook Form + Zod | Form handling and validation |

---

## Project Structure

```
├── public/                    # Static assets served directly
│   ├── favicon.png           # Browser tab icon
│   ├── robots.txt            # Search engine crawling rules
│   └── sitemap.xml           # SEO sitemap
│
├── src/
│   ├── assets/               # Imported static images
│   │   ├── logo.png          # Brand logo
│   │   ├── hero-background.jpg
│   │   └── stationery-background.png
│   │
│   ├── components/
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.tsx    # Navigation header with cart
│   │   │   ├── Footer.tsx    # Site footer
│   │   │   ├── NavLink.tsx   # Navigation link wrapper
│   │   │   ├── DeliveryBanner.tsx  # Delivery info banner
│   │   │   ├── DeliveryModal.tsx   # Delivery details modal
│   │   │   └── index.ts      # Barrel exports
│   │   │
│   │   ├── products/         # Product-related components
│   │   │   ├── ProductCard.tsx       # Product display card
│   │   │   ├── ProductMediaViewer.tsx # Image/video viewer
│   │   │   ├── BundleCard.tsx        # Bundle offer card
│   │   │   ├── OffersSection.tsx     # Homepage offers carousel
│   │   │   └── index.ts      # Barrel exports
│   │   │
│   │   ├── common/           # Shared utility components
│   │   │   ├── SEO.tsx       # Meta tags management
│   │   │   ├── PullToRefresh.tsx # Mobile pull-to-refresh
│   │   │   └── index.ts      # Barrel exports
│   │   │
│   │   ├── cart/             # Cart-specific components
│   │   │   └── ProductImageGallery.tsx
│   │   │
│   │   ├── admin/            # Admin dashboard components
│   │   │   ├── InventoryDashboard.tsx
│   │   │   ├── SalesDashboard.tsx
│   │   │   ├── BundlesTab.tsx
│   │   │   ├── QuickSaleDialog.tsx
│   │   │   └── TestimonialAnalytics.tsx
│   │   │
│   │   ├── testimonials/     # Customer review components
│   │   │   ├── TestimonialCard.tsx
│   │   │   ├── ReviewSubmissionForm.tsx
│   │   │   ├── StoriesCarousel.tsx
│   │   │   ├── StoryCircles.tsx
│   │   │   └── FeaturedTestimonial.tsx
│   │   │
│   │   ├── brochure/         # Printable catalog components
│   │   │   ├── BrochureCover.tsx
│   │   │   ├── BrochureCategory.tsx
│   │   │   ├── BrochureProduct.tsx
│   │   │   ├── BrochureHeader.tsx
│   │   │   └── BrochureFooter.tsx
│   │   │
│   │   └── ui/               # shadcn/ui primitives (DO NOT MODIFY)
│   │       └── ... (40+ UI components)
│   │
│   ├── contexts/             # React contexts
│   │   └── CartContext.tsx   # Shopping cart state
│   │
│   ├── data/                 # Static/mock data
│   │   └── products.ts       # Fallback product data
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-mobile.tsx    # Mobile viewport detection
│   │   ├── use-toast.ts      # Toast notifications
│   │   ├── use-footer-visibility.tsx
│   │   └── use-pull-to-refresh.tsx
│   │
│   ├── integrations/         # External services
│   │   └── supabase/
│   │       ├── client.ts     # ⚠️ AUTO-GENERATED
│   │       └── types.ts      # ⚠️ AUTO-GENERATED
│   │
│   ├── lib/                  # Utility functions
│   │   └── utils.ts          # cn() class merger
│   │
│   ├── pages/                # Route page components
│   │   ├── Index.tsx         # Homepage
│   │   ├── Cart.tsx          # Shopping cart
│   │   ├── Offers.tsx        # Bundle deals
│   │   ├── Testimonials.tsx  # Customer reviews
│   │   ├── Brochure.tsx      # Printable catalog
│   │   ├── Auth.tsx          # Login/signup
│   │   ├── Admin.tsx         # Admin dashboard
│   │   └── NotFound.tsx      # 404 page
│   │
│   ├── types/                # TypeScript definitions
│   │   ├── product.ts        # Product interfaces
│   │   ├── bundle.ts         # Bundle interfaces
│   │   └── testimonial.ts    # Testimonial interfaces
│   │
│   ├── App.tsx               # Main app with routing
│   ├── App.css               # App-specific styles
│   ├── index.css             # Global styles & Tailwind config
│   └── main.tsx              # App entry point
│
├── supabase/
│   ├── functions/            # Edge functions (serverless)
│   │   ├── create-order/     # Order processing
│   │   ├── recalculate-profits/
│   │   └── track-story-view/
│   ├── migrations/           # Database migrations
│   └── config.toml           # Supabase configuration
│
└── Configuration files
    ├── vite.config.ts        # Vite settings
    ├── tailwind.config.ts    # Tailwind theme
    ├── tsconfig.json         # TypeScript config
    └── vercel.json           # Deployment settings
```

---

## Key Files Reference

### Entry Points
| File | Purpose |
|------|---------|
| `index.html` | HTML template with SEO meta tags |
| `src/main.tsx` | React app bootstrap |
| `src/App.tsx` | Main component with routing |

### Auto-Generated (DO NOT EDIT)
| File | Reason |
|------|--------|
| `src/integrations/supabase/client.ts` | Generated by Lovable Cloud |
| `src/integrations/supabase/types.ts` | Generated from DB schema |
| `.env` | Environment variables |
| `supabase/migrations/*` | Database version history |

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `products` | Product catalog | id, name, price, cost_price, stock, category, image |
| `product_media` | Additional product images/videos | product_id, media_url, media_type |
| `orders` | Customer orders | customer_name, phone, total, status, tags |
| `order_items` | Order line items | order_id, product_name, quantity, price, profit |
| `bundles` | Product bundles | name, bundle_price, original_total_price, is_active |
| `bundle_items` | Bundle contents | bundle_id, product_id, quantity |
| `customer_testimonials` | Reviews | customer_name, review_text, rating, video_url |
| `story_views` | View analytics | testimonial_id, view_duration, completed |
| `stock_movements` | Inventory tracking | product_id, change, reason |
| `user_roles` | Admin access | user_id, role (admin/user) |

---

## Routes

| Path | Page | Auth Required | Description |
|------|------|---------------|-------------|
| `/` | Index | No | Homepage with products |
| `/cart` | Cart | No | Shopping cart |
| `/offers` | Offers | No | Bundle deals |
| `/testimonials` | Testimonials | No | Customer stories |
| `/happy-customers` | Testimonials | No | Alias for reviews |
| `/brochure` | Brochure | No | Printable catalog |
| `/auth` | Auth | No | Login/signup |
| `/admin` | Admin | Yes (admin) | Dashboard |

---

## Contexts

### CartContext
Manages shopping cart state with localStorage persistence.

```typescript
// Usage
const { addToCart, removeFromCart, getCartTotal } = useCart();
```

**Methods:**
- `addToCart(product)` - Add item
- `removeFromCart(productId)` - Remove item
- `updateQuantity(productId, quantity)` - Change quantity
- `clearCart()` - Empty cart
- `getCartTotal()` - Calculate total
- `getCartItemCount()` - Count items
- `addBundleToCart(bundle)` - Add bundle
- `removeBundleFromCart(bundleId)` - Remove bundle

---

## Custom Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useIsMobile()` | Detect mobile viewport (<768px) | `boolean` |
| `useToast()` | Toast notifications | `{ toast, dismiss }` |
| `useFooterVisibility()` | Track footer intersection | `boolean` |
| `usePullToRefresh(options)` | Pull-to-refresh gesture | `{ isRefreshing, pullDistance }` |

---

## Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `create-order` | POST `/create-order` | Validate and create orders, update stock |
| `recalculate-profits` | Manual | Recalculate order profit margins |
| `track-story-view` | POST `/track-story-view` | Track testimonial view analytics |

---

## Component Categories

### Layout Components (`/components/layout/`)
Global UI elements that appear on multiple pages.

### Product Components (`/components/products/`)
Product display, bundles, and shopping features.

### Common Components (`/components/common/`)
Reusable utilities like SEO and pull-to-refresh.

### Admin Components (`/components/admin/`)
Dashboard widgets for inventory, sales, and analytics.

### Testimonial Components (`/components/testimonials/`)
Instagram-style stories and review display.

### UI Components (`/components/ui/`)
shadcn/ui primitives - DO NOT modify directly.

---

## Development

### Getting Started
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Environment Variables
Automatically configured by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Adding New Features

1. **New Page**: Add route in `src/App.tsx`, create page in `src/pages/`
2. **New Component**: Place in appropriate folder, update barrel exports
3. **Database Changes**: Use migration tool (handled by Lovable)
4. **Edge Function**: Create in `supabase/functions/`

---

## Design System

### Colors (from `src/index.css`)
- `--primary`: Brand green
- `--secondary`: Accent color
- `--background`: Page background
- `--foreground`: Text color
- `--muted`: Subtle backgrounds
- `--border`: Border color

### Breakpoints
- `xs`: 375px (small mobile)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

---

## Notes for Developers

1. **Never edit** files in `src/integrations/supabase/` - they're auto-generated
2. **Use barrel exports** from `index.ts` files when importing components
3. **Follow folder structure** - layout, products, common, etc.
4. **Test on mobile** - Many users access via smartphone
5. **Check RLS policies** - Database has row-level security enabled
