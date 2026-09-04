# School List quoting flow + footer logo

## What you get

1. **Build a quote from a submitted list.** In Admin > School Lists, each submission gets a "Build quote" button. It opens a dialog with the customer's typed list (and their attachment link) pinned on one side, and a product search on the other. Staff tick items off the list, set quantities, mark anything you don't stock as "not available", and the dialog totals it live with an optional discount.

2. **Send it on WhatsApp.** One button builds a clean, itemized quote message (bold header, item lines with quantity and price, total, plus a "not in stock" note where relevant) and opens WhatsApp to the customer's number. Sending marks the submission as `quoted` and saves the quote so it can be reopened, edited and re-sent later.

3. **Turn a quote into an order.** From the same dialog, "Convert to order" creates a real order with order items (same path Quick Sale already uses: stock deduction, profit tracking), links it to the submission, and moves the submission to `converted`.

4. **Footer logo.** The footer currently shows the small square icon plus a text "ARIS". It will use the full official lockup so the footer matches the brand mark used elsewhere, sized for both mobile and desktop, with the tagline kept underneath.

## Technical notes

**Database migration** on `public.school_list_submissions`:
- `quote_items jsonb default '[]'` (product id, variant id, name, qty, unit price, unit cost, available flag)
- `quote_total numeric`, `quote_discount numeric default 0`, `quoted_at timestamptz`, `order_id uuid references public.orders(id)`
- No new table, so existing RLS/grants stay as they are.

**New component** `src/components/admin/SchoolListQuoteDialog.tsx`
- Loads products with variants (same query shape as Quick Sale), search + variant picker reused in spirit from `QuickSaleDialog.tsx`.
- Left pane: raw `list_text` in a monospace block, plus signed-URL link to the attachment.
- Right pane: selected line items with qty steppers, unit price override, "not available" toggle, discount (percentage or fixed), live subtotal/total.
- Persists the draft quote back to the submission row on save.
- WhatsApp message built with `formatPhoneForWhatsApp` from `src/types/communication.ts`, professional tone, bold headers, no emojis.
- Convert-to-order writes `orders` + `order_items` and calls `adjust_stock` / `adjust_variant_stock`, matching QuickSaleDialog logic, then stores `order_id` on the submission.

**`SchoolListSubmissions.tsx`**: add the "Build quote" / "View quote" button per row, show a `KSh X` quote badge once a quote exists, and keep the existing status select in sync automatically.

**`Footer.tsx`**: swap `aris-icon.png.asset.json` for `aris-lockup.png.asset.json` in the brand block and drop the duplicated text wordmark.
