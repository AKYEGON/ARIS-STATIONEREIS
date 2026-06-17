---
name: Unified Review Request Flow
description: Delivered/Picked Up status messages auto-include per-product /review/{token} links; SendReviewRequestsModal is the Resend fallback
type: feature
---
When admin changes order status to "Delivered" or "Picked Up" (case-insensitive, incl. picked-up/pickedup), OrderStatusModal automatically:
1. Calls `prepareReviewRequests(order)` from `src/lib/review-requests.ts` to idempotently create one `review_requests` row per distinct product in the order.
2. Builds the message via `buildStatusReviewMessage(status, order, rows)` — status-appropriate intro + numbered list of `https://arisstationaries.co.ke/review/{token}` links.
3. On Send, calls `markReviewRequestsSent(orderId, channel)` to flip non-submitted rows to `status='sent'`.

`use-order-communication.ts` `getMessageForStatus` no longer includes the generic `/testimonials?review=true` link for Delivered — that path is fully replaced. Delivered/Picked Up templates there are bare fallbacks only used if `prepareReviewRequests` fails.

The standalone "Resend Review Requests" button (Admin order details, shown for delivered/picked up orders) uses the SAME `prepareReviewRequests` helper. It's the resend path for orders completed before this unified flow, or when the original message didn't go through.

Shared helper: `src/lib/review-requests.ts` exports `prepareReviewRequests`, `buildReviewMessage`, `buildStatusReviewMessage`, `markReviewRequestsSent`, `isReviewTriggerStatus`. Both modals must use it — do not duplicate logic.
