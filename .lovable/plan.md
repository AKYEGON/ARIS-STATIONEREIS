## Smarter product → course allocation

Today you open every course and tick products one at a time. We'll flip that: from the **product side**, pick all the courses (across faculties) it belongs to in one shot.

### What you'll see

In **Admin → Products**, each product row gets a new **"Courses"** button.

Clicking it opens a dialog:

```text
Manage courses for: Scientific Calculator
─────────────────────────────────────────
[ Search faculties / courses…        ]
[ Select all visible ] [ Clear all ]
Currently in 8 courses

▾ Faculty of Engineering            (4 / 12)
   ☑ Civil Engineering
   ☑ Mechanical Engineering
   ☐ Software Engineering
   …
▾ Faculty of Business               (0 / 6)
   ☐ Accounting
   ☐ Finance
   …

[ Cancel ]                    [ Save changes ]
```

- Faculties are collapsible groups; each shows "x of y selected".
- Smart search filters both faculty and course names.
- **Select all visible / Clear all** act on the current filter only.
- Save diffs against current allocations: inserts new `course_products` rows, deletes removed ones. Year tags stay "All years" (per your choice).

### Where it lives

- New component: `src/components/admin/ProductCoursesDialog.tsx`
- Hook into the existing product list in `src/components/admin/` (the Products tab) — add a small **"Courses"** action button next to Edit.

### Technical notes

- On open, fetch:
  - `faculties` (active, ordered)
  - `courses` (active, ordered, with `faculty_id`)
  - `course_products` where `product_id = <this product>` → seed selected set
- On Save:
  - Compute `toAdd` and `toRemove` from selected vs initial set.
  - `insert` rows into `course_products` for `toAdd`.
  - `delete` rows in `course_products` where `product_id = X AND course_id IN (toRemove)` — this cascades nothing extra; `course_product_years` rows for removed allocations are orphaned, so we also delete matching `course_product_years` rows first.
- No schema changes. No changes to the existing course-side allocation UI — it stays as-is for fine-tuning year tags.

### Out of scope

- Bulk year-tag assignment (you chose "All years" only).
- Category-based auto-assign, course templates, copy-from-course (can add later if needed).
