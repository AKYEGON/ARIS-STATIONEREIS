
# Agent Role & Zone-Based Order System

## Overview
Add an "agent" role where agents are assigned to geographic zones. Customers select an agent zone during checkout, and agents only see orders from their assigned zone. Admins get agent performance analytics.

## Step 1: Database Migration
- Add `agent` to the `app_role` enum
- Create `agent_zones` table (id, name, display_order, is_active, created_at)
- Create `agent_zone_assignments` table (id, user_id, zone_id) — links agents to their zone
- Add `agent_zone_id` column to `orders` table (nullable UUID, references agent_zones)
- RLS policies:
  - `agent_zones`: public read, admin write
  - `agent_zone_assignments`: admin write, agents can read their own
  - Orders: agents can SELECT/UPDATE orders where `agent_zone_id` matches their assigned zone

## Step 2: Admin Settings — Agent Zone Manager
- Add a "Agent Zones" management section in the Settings tab (similar to Universities/Outlets)
- CRUD for zones (name, display order, active toggle)

## Step 3: Agent Onboarding in Team Tab
- Update the approve/manage staff flow to support the "agent" role
- When approving as agent, show a zone assignment dropdown
- Update the `manage-staff` edge function to handle agent role + zone assignment

## Step 4: Checkout Flow Update
- Add an "Agent Zone" dropdown in the checkout form (optional, shown alongside delivery address)
- Fetch active zones from `agent_zones` table
- Save selected `agent_zone_id` on the order

## Step 5: Agent Dashboard
- When a user with `agent` role logs into Admin, show a simplified view:
  - Only their zone's orders (filtered by `agent_zone_id`)
  - Order details view (customer info, items, status)
  - No access to Products, Inventory, Sales, Team, Settings, Testimonials, Bundles tabs
- Agent can view order details but NOT modify them (view-only based on user's answer)

## Step 6: Admin Agent Analytics
- Add an "Agent Performance" section in the Sales Dashboard
- Show per-agent/zone metrics: order count, total revenue, delivery rate
- Filter by time range (reuse existing range selector)

## Step 7: Update Edge Functions
- Update `create-order` to accept and validate `agent_zone_id`
- Update `manage-staff` to handle agent role + zone assignment

## Files to Create/Modify
- **New migration**: enum update, new tables, RLS policies, orders column
- `src/pages/Admin.tsx` — conditional tab rendering for agents
- `src/pages/Cart.tsx` — agent zone dropdown in checkout
- `src/components/admin/AgentZoneManager.tsx` — new CRUD component
- `src/components/admin/EmployeeManagement.tsx` — agent role + zone picker
- `src/components/admin/SalesDashboard.tsx` — agent analytics section
- `supabase/functions/manage-staff/index.ts` — agent support
- `supabase/functions/create-order/index.ts` — agent_zone_id field
