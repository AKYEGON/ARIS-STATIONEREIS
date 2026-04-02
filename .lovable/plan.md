

# Product Categorization & Homepage Control

## Current State
- Products have a free-text `category` field — most products have it **empty** (blank string), with a few set to "counter books", "FILES", "gifts".
- The admin product form uses a plain text input for category — no predefined options.
- The shop homepage shows **all products** ordered by `created_at` descending — no way to control what appears first or filter by category.
- No `is_featured` or `display_order` field exists on the products table.

## What We Will Build

### 1. Predefined Product Categories (for Kenyan university students)

Create a `product_categories` table with curated categories relevant to university students in Kenya:

| Category | Example Products |
|----------|-----------------|
| Engineering & Drawing | T-squares, set squares, drawing boards, technical pens, French curves |
| Scientific Calculators | FX-82, FX-991, FX-570 |
| Writing Instruments | Pens, pencils, highlighters, markers |
| Notebooks & Papers | Counter books, exercise books, A4 paper, graph paper |
| Filing & Organization | Box files, folders, envelopes, binders |
| Art & Craft Supplies | Colored pencils, paint, brushes, scissors, glue |
| Office Supplies | Staplers, staples, tape, erasers, sharpeners |
| Exam Essentials | Mathematical sets, rulers, erasers, clear pencil cases |
| Gifts & Accessories | Gift sets, desk accessories |
| General Stationery | Miscellaneous items |

The admin will select from a dropdown instead of typing free-text.

### 2. Homepage Product Control

Add two columns to the `products` table:
- **`is_featured`** (boolean, default false) — controls whether a product appears on the shop homepage
- **`display_order`** (integer, default 0) — controls the ordering of featured products

The shop homepage will show only featured products (or all products if none are featured, as a fallback). Admin gets a toggle to mark products as "Show on Homepage" and drag/reorder them.

### 3. Category Filter on Shop Page

Add a horizontal scrollable category filter bar on the shop page so customers can browse by category (e.g., tap "Engineering & Drawing" to see only those products).

---

## Technical Plan

### Step 1: Database Migration
- Create `product_categories` table (id, name, slug, display_order, is_active, icon)
- Add `is_featured` (boolean default false) and `display_order` (integer default 0) columns to `products`
- Seed the table with the 10 categories listed above
- RLS: public read, admin write

### Step 2: Update Admin Product Form
- Replace the free-text category `Input` with a `Select` dropdown that fetches from `product_categories`
- Add a "Featured on Homepage" toggle (Switch) and display_order input in the product form
- Add a quick "Feature/Unfeature" button in the product list table

### Step 3: Update Shop Homepage (Index.tsx)
- Add a horizontal scrollable category filter bar below the search
- Fetch products with `is_featured = true` first, ordered by `display_order`, then remaining products
- When a category is selected, filter products to that category
- Show an "All" option to reset the filter

### Step 4: Update Product Type
- Add `is_featured` and `display_order` to the `Product` TypeScript interface

### Files to Create/Modify
- **New migration**: Add `product_categories` table + `is_featured`/`display_order` columns + seed data
- `src/types/product.ts` — add new fields
- `src/pages/Index.tsx` — add category filter bar, featured product logic
- `src/pages/Admin.tsx` — replace category input with dropdown, add featured toggle

