# Book of the Week — Phase 1

## Rules captured from your answers
- **Multiple reservations per phone allowed** (same book or different books).
- **Genres**: dropdown sourced from a `book_genres` table, fully admin-managed (add/edit/delete).
- **Delivery**: reuses existing checkout (pickup outlets + universities).
- **Store credit**: usable on any product, not books-only.
- **Weekly cycle**: new books go live **Thursday** (handover day for previous week) and close **Wednesday 23:59**. Pickup/delivery the following Thursday.
- **Payment**: customer can pay **deposit only** OR **full price upfront** at reservation. Either way via M-Pesa STK Push.
- **Fulfilment**: just-in-time (order from supplier on Thursday based on confirmed slots).

---

## Lifecycle

```
THU 00:00 → new week opens. Books visible, slots open.
THU–WED → customers reserve (deposit or full). Slot decrements atomically.
WED 23:59 → reservations close. Admin sees final tally.
THU       → handover day. Deposit-holders pay balance via STK Push,
            collect at outlet or get delivery. New week opens same day.
SAT (auto) → any unclaimed deposit-only reservation → released,
             deposit converted to store credit.
```

If a book misses its `min_threshold` by Wed midnight → auto-cancelled, deposits refunded to store credit, customers notified.

---

## Data model (5 new tables)

**`book_genres`** — admin-managed dropdown source
- name, slug, display_order, is_active

**`books`** — one row per book offering
- title, author, genre_id, cover_url, synopsis, isbn (optional), slug
- full_price, deposit_amount
- slots_total, slots_reserved (atomic counter), min_threshold
- week_starts_at (Thu 00:00), week_ends_at (Wed 23:59), pickup_date (Thu)
- status: `draft | open | closed | fulfilled | cancelled`

**`book_reservations`** — one row per slot
- book_id, customer_name, customer_phone, customer_email (optional)
- payment_type: `deposit | full`
- amount_paid, balance_due (0 if full), mpesa_reference
- delivery_method, delivery_address (mirrors checkout shape)
- status: `pending_payment | reserved | balance_paid | collected | delivered | released | refunded`
- store_credit_issued (bool), created_at

**`store_credit_ledger`** — universal store credit (usable on any product)
- customer_phone, amount (+ credit / − debit), source (`book_refund | order_use | manual_adjust`), reference_id, balance_after
- View `customer_store_credit` aggregates current balance per phone

**`book_payments`** — M-Pesa transaction log
- reservation_id, type (`deposit | balance | full`), amount, mpesa_checkout_id, mpesa_receipt, status, raw_callback (jsonb)

---

## Atomic slot reservation
DB function `reserve_book_slot(book_id, phone, payment_type, …)` — locks book row, checks `slots_reserved < slots_total` AND `status = 'open'` AND `now() < week_ends_at`, increments counter, inserts reservation, returns row. Prevents overselling under concurrency.

---

## M-Pesa STK Push
Two edge functions:
- `mpesa-stk-push` — initiate payment, returns `CheckoutRequestID`.
- `mpesa-callback` — webhook from Safaricom, marks payment success/fail, updates reservation status.

Requires Safaricom Daraja credentials (Consumer Key, Consumer Secret, Passkey, Shortcode). I'll request these via `add_secret` when we reach that step.

---

## Cron jobs (pg_cron + pg_net)
- **Wed 23:59 EAT** — close current week: flip open→closed, evaluate min_threshold, cancel + refund books that missed it.
- **Sat 00:00 EAT** — release stale deposit-only reservations not collected by Friday, convert deposit → store credit.
- **Thu 00:00 EAT** — auto-publish books whose `week_starts_at` arrived (status draft→open).

---

## Customer-facing routes
- **`/books`** — current week landing: book cards with cover, title, author, genre badge, full price, deposit, "X/100 slots left", countdown to Wed 23:59.
- **`/books/:slug`** — book detail: synopsis, reserve CTA, choice of "Pay deposit (KSh X)" or "Pay full (KSh Y)", phone + name, delivery selector (reuses checkout component), STK push trigger.
- **`/books/my-reservations?phone=…`** — customer self-service: status, pay balance button (STK push), store credit balance.

Nav: add **Books** to mobile bottom bar + desktop header.

---

## Admin (new Admin tab "Books")
- **Books manager**: CRUD books, set week dates, slots, prices, min_threshold, cover upload, genre dropdown.
- **Genres manager**: CRUD genres.
- **Reservations dashboard per book**: list reservations, payment status, mark collected/delivered, send WhatsApp follow-ups (reusing existing comm system templates).
- **Store credit ledger viewer**: search by phone, manual adjustments.

---

## Integration with existing systems
- **Cart / checkout** — at checkout, look up store credit by phone, offer "Apply KSh X store credit" → records debit in `store_credit_ledger`.
- **WhatsApp templates** — new templates: reservation confirmed, balance reminder (Thu), ready for pickup, deposit refunded as credit. Reuses `message_templates` + `OrderStatusModal` pattern.
- **SEO** — `/books`, `/books/:slug` get title/meta/JSON-LD Book schema; sitemap generator extended.
- **Toast positions, navigation, footer hide on stories** — all existing project rules respected.

---

## Build order (so you can validate each step)
1. Migration: tables + RLS + GRANTs + atomic reservation function + cron jobs (paused) + store_credit_ledger.
2. Admin: Genres manager → Books manager → Reservations dashboard.
3. Customer routes `/books` + `/books/:slug` (without payment — "reserve" creates pending row).
4. M-Pesa STK Push edge functions + secrets + wire to reserve flow.
5. `/books/my-reservations` + balance payment flow.
6. Store credit application at checkout.
7. WhatsApp templates + admin comm buttons.
8. Activate cron jobs + SEO + sitemap.

---

## Open question before I start
**M-Pesa Daraja**: do you already have a Safaricom Daraja Paybill/Till + API credentials, or do we need to plan around using sandbox first while you apply for production? This affects whether step 4 ships live or in test mode.
