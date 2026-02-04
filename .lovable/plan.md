
# Review Request Integration Plan

## Overview
Encourage more customer reviews by including a direct review link in the "Delivered" order message and providing a way for walk-in customers (Quick Sale) to submit reviews.

---

## Current State

**Delivered Message Template:**
```
Hi {name}! Your order #{id} has been delivered. 
Thank you for shopping with ARIS STATIONERIES! We'd love your feedback 💙
```

**Problem:** No actionable link for customers to actually leave a review.

---

## Solution

### 1. Add Review Link to Delivered Message

Update the "Delivered" status message template to include a direct link to the testimonials page:

**New Template:**
```
Hi {name}! Your order #{id} has been delivered. 
Thank you for shopping with ARIS STATIONERIES! 

We'd love to hear about your experience! 
Leave a quick review here: {review_link}

Your feedback helps us serve you better 💙
```

The review link will be: `https://your-domain.com/happy-customers` (or `/testimonials`)

---

### 2. Quick Sale Review Request

For walk-in customers with a phone number, add an option to send them a review request after completing the sale.

**Options:**
- Add a "Send Review Request" button that appears after sale completion
- Show a QR code they can scan in-store to leave a review
- Print a small receipt with review link (if printer is connected)

**Recommended Approach:** After completing a Quick Sale, show a success dialog with:
- Option to send WhatsApp review request to the customer (if phone provided)
- A QR code that links to the review page (customer can scan immediately)

---

## Technical Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/use-order-communication.ts` | Update "Delivered" message template to include review link |
| `src/components/admin/QuickSaleDialog.tsx` | Add post-sale review request option with QR code display |

### New File (Optional)

| File | Purpose |
|------|---------|
| `src/components/admin/QuickSaleSuccessDialog.tsx` | Success modal with review request options and QR code |

---

## Implementation Details

### Step 1: Update Delivered Message Template

Modify the `getMessageForStatus` function to include the review link:

```typescript
'Delivered': `Hi ${order.customer_name}! Your order #${order.id.slice(0, 8).toUpperCase()} has been delivered. Thank you for shopping with ARIS STATIONERIES!

We'd love to hear about your experience! Leave a quick review: https://your-site.com/happy-customers

Your feedback helps us serve you better 💙`
```

### Step 2: Quick Sale Success Flow

After completing a walk-in sale:

1. Show a success dialog instead of just a toast
2. Display sale summary (total, items)
3. If customer phone was provided:
   - Show "Send Review Request" button (opens WhatsApp with pre-written message)
4. Display a QR code linking to `/happy-customers` page
5. Staff can show QR code to customer before they leave

### Step 3: QR Code Generation

Use a simple QR code library or generate via API:
- Link: `/happy-customers` (testimonials page)
- Can pre-fill customer name if provided

---

## User Experience

### For Delivered Orders (Online)
1. Admin marks order as "Delivered"
2. Status modal opens with updated message including review link
3. Customer receives WhatsApp/SMS with clickable link
4. Customer taps link and lands on review submission page

### For Walk-in Customers (Quick Sale)
1. Staff completes sale
2. Success dialog appears with QR code
3. Staff shows QR code to customer: "Scan to leave us a review!"
4. If phone was entered, staff can also tap "Send Review Request"
5. Customer receives WhatsApp message with review link

---

## Message Templates

### Delivered Order Review Request
```
Hi {name}! Your order #{id} has been delivered. 
Thank you for shopping with ARIS STATIONERIES!

Share your experience with us:
{review_link}

Your feedback means the world to us! 💙
```

### Walk-in Customer Review Request
```
Hi {name}! Thank you for shopping at ARIS STATIONERIES today.

We'd love to hear about your experience! 
Leave a quick review: {review_link}

See you again soon! 🛍️
```

---

## Summary

| Feature | Benefit |
|---------|---------|
| Review link in Delivered message | Every completed order gets review request |
| QR code for walk-ins | Easy in-store review collection |
| WhatsApp integration | Familiar channel for customers |
| Pre-filled customer name | Smoother review submission |

