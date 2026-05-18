## Stop typing years for every course

Two new tools in the admin:

### 1. Year Templates (one-time setup, reusable forever)

A new **"Year Templates"** section inside **Admin → Shop by Course** (top of the faculties view).

```text
Year Templates                              [ + New template ]
─────────────────────────────────────────────────────────────
📚 Standard 4-Year        Year 1, Year 2, Year 3, Year 4         [Apply] [Edit] [Delete]
🩺 Medicine 6-Year        Year 1 … Year 6, Clinical Year         [Apply] [Edit] [Delete]
⚖️  Law 4-Year             Year 1 … Year 4, Bar Prep              [Apply] [Edit] [Delete]
```

Each template = a name + an ordered list of year labels.

**Apply template** opens a course picker (same UX as the "Manage Courses" dialog you just got):

```text
Apply "Standard 4-Year" to courses
[ Search faculties / courses… ]   [ Select all visible ] [ Clear all ]

▾ Faculty of Engineering (12)
   ☑ Civil Engineering          ← already has years (will merge)
   ☑ Mechanical Engineering
   ☐ Software Engineering
▾ Faculty of Business (6)
   ☐ Accounting
   …

Mode: ◉ Merge (add missing labels only — safe)        [ Cancel ] [ Apply to 8 courses ]
```

- **Merge only**: for each picked course, insert any template labels it doesn't already have (case-insensitive match on label). Existing years and their product tags stay untouched.
- Display order continues from the course's current max.

### 2. Bulk product → year tagging by label

In the existing **"Manage Courses for: <product>"** dialog (the 🎓 button on each product row), add a small section above the course list:

```text
Apply to years (matched by label across all picked courses):
[ All years ▼ ]   ☑ Year 1   ☑ Year 2   ☐ Year 3   ☐ Year 4   ☐ Clinical Year

(Labels are gathered from every course you tick. Tagging happens for whichever
 picked courses actually have that label — others stay "All years".)
```

On Save: after upserting `course_products`, for each picked course look up its `course_years` whose label is in the selected set and write the matching `course_product_years` rows (and remove rows that no longer match). If no labels are chosen → behaves like today ("All years").

This means: tick "Year 1" once, and the product is tagged to Year 1 in **every** course you assigned it to that has a Year 1 — no per-course clicking.

### Where it lives

- New table: `year_templates` (id, name, display_order, is_active) + `year_template_items` (template_id, label, display_order)
- New component: `src/components/admin/YearTemplatesManager.tsx` — list + add/edit/delete templates
- New component: `src/components/admin/ApplyYearTemplateDialog.tsx` — course picker + merge action
- Edit: `src/components/admin/FacultyManager.tsx` — render `<YearTemplatesManager />` at the top of the faculties view
- Edit: `src/components/admin/ProductCoursesDialog.tsx` — add the "Apply to years" label chips + extended save logic

### Technical notes

- **Migration**: create `year_templates` and `year_template_items` with admin-only RLS (mirror existing `faculties` policies); `SELECT` open to all so dropdowns work everywhere.
- **Apply (merge)**: client-side per picked course → fetch existing `course_years.label` (lowercased), diff against template labels, bulk-insert the missing ones with continued `display_order`.
- **Year-label tagging in ProductCoursesDialog**: when the user ticks courses, union all their `course_years` into a label set (deduped, case-insensitive) and render as chips. On Save, for each finally-selected `course_product`, look up its course's `course_years` whose label matches a chosen chip, then sync `course_product_years` (insert missing, delete removed). Labels chosen but absent in a given course → silently skipped for that course.
- No schema change to `course_years` / `course_product_years` — we keep year IDs per course, just spare the admin from creating them manually.

### Out of scope

- Auto-applying a faculty default to brand-new courses (you picked templates only).
- Renaming a year label everywhere at once (can add later).
- Deleting years through "replace" mode (you picked merge-only).
