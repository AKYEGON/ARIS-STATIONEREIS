# Course Years + Year-Specific Bundles

Goal: let admin tag stationery (and create bundles) for specific academic years inside a course (e.g. "Data Science · Year 1"). Students drill into a course and use year chips to filter products and see the bundle for that year.

## What students see

On `/students` after picking a faculty → course:
- A row of year chips at the top (e.g. `All · Year 1 · Year 2 · Clinical Year`). Chips come from what admin defined on that course.
- Below the chips: the year's bundle card (if one exists) followed by the products tagged to that year.
- "All" keeps current behaviour — every product allocated to the course.

## Admin experience

1. **Course Years manager** (inside the existing Faculty/Course admin):
   - Per course, add free-form year labels with display order (e.g. "Year 1", "Year 2", "Clinical Year").
   - Edit / reorder / deactivate.

2. **Course Products allocation** gains a year multi-select:
   - When attaching a product to a course, admin ticks one or more year labels (or "All years").
   - Existing rows stay as "All years" by default.

3. **Course Bundles** (new section):
   - Admin creates a bundle scoped to course + year (name, price, original total, image, items).
   - Works like the existing bundles table but only visible on its course/year page.

## Technical details

### Schema (migration)

```sql
-- 1. Year labels per course
CREATE TABLE public.course_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  label text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.course_years(course_id);

-- 2. Many-to-many: which years does a course_product apply to
CREATE TABLE public.course_product_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_product_id uuid NOT NULL,
  course_year_id uuid NOT NULL,
  UNIQUE(course_product_id, course_year_id)
);
-- Empty rows for a course_product = "All years" (backwards-compatible).

-- 3. Course-year bundles (separate from homepage bundles)
CREATE TABLE public.course_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  course_year_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  image text NOT NULL,
  bundle_price numeric NOT NULL,
  original_total_price numeric NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_bundle_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity int NOT NULL DEFAULT 1
);
```

RLS for all three: public SELECT, admin INSERT/UPDATE/DELETE (matches `courses` / `bundles` patterns).

### Frontend

- `src/pages/Students.tsx`
  - When a course is active: fetch `course_years` for it + `course_product_years` join + `course_bundles` for it.
  - Render year chips (with "All"). Filter products by the selected year. Show matching `course_bundles` above products.
  - Cart integration for course bundles reuses the existing bundle-add helper.

- `src/components/admin/FacultyManager.tsx` (or a sibling)
  - Add a "Years" sub-panel per course (CRUD on `course_years`).
  - Update the "allocate products" UI to multi-select years per product.
  - New "Course Bundles" tab with CRUD scoped to course + year, item picker reused from existing `BundlesTab`.

### Out of scope

- No changes to the existing homepage `bundles` table.
- No course-year filter on `/shop` (only on `/students`).
- No automatic year suggestion — admin always picks.
