

# Employee & Manager Management System Plan

## Overview
Create a three-tier role-based access control system:
- **Admin**: Full access to everything
- **Manager**: Can manage inventory (including stock adjustments) and view sales data, but cannot access cost prices or profit margins
- **Employee**: Limited to Quick Sale and viewing orders - no access to sensitive financial data

---

## Role Permissions Matrix

| Feature | Admin | Manager | Employee |
|---------|-------|---------|----------|
| Quick Sale | Yes | Yes | Yes |
| View Orders | Yes | Yes | Yes |
| Update Order Status | Yes | Yes | Yes |
| View Products (selling price only) | Yes | Yes | Yes |
| Add/Edit/Delete Products | Yes | No | No |
| View Inventory | Yes | Yes | Yes (no cost/profit) |
| Adjust Stock | Yes | Yes | No |
| View Sales Dashboard | Yes | Yes (no profit) | No |
| View Cost Prices/Profit | Yes | No | No |
| Testimonials Management | Yes | No | No |
| Bundles Management | Yes | No | No |
| Team/Employee Management | Yes | No | No |

---

## What Gets Hidden from Employees

1. **Products Tab**: Cost price field in add/edit forms
2. **Inventory Dashboard**: Cost price column, Profit column, Inventory Value card
3. **Sales Dashboard**: Entire tab hidden from employees
4. **Products/Bundles/Testimonials Tabs**: Hidden entirely

## What Gets Hidden from Managers

1. **Products Tab**: Cost price field in add/edit forms (read-only access)
2. **Inventory Dashboard**: Cost price column, Profit column, Inventory Value card
3. **Sales Dashboard**: Profit card, profit columns in tables
4. **Bundles/Testimonials Tabs**: Hidden entirely
5. **Team Tab**: Hidden entirely

---

## Database Changes

### 1. Add 'employee' and 'manager' to app_role enum

```sql
ALTER TYPE app_role ADD VALUE 'employee';
ALTER TYPE app_role ADD VALUE 'manager';
```

### 2. Create employee_profiles table

```sql
CREATE TABLE employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage employee profiles
CREATE POLICY "Admins can view employee profiles"
  ON employee_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert employee profiles"
  ON employee_profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employee profiles"
  ON employee_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employee profiles"
  ON employee_profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
```

### 3. Update RLS policies for stock_movements

Allow managers to also insert stock movements:

```sql
DROP POLICY IF EXISTS "Admins can insert stock movements" ON stock_movements;

CREATE POLICY "Admins and managers can insert stock movements"
  ON stock_movements FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );
```

---

## Code Changes

### 1. Update Admin.tsx

**Current State**: Only checks for 'admin' role

**Changes**:
- Modify `checkAdminAccess` to check for admin, manager, OR employee roles
- Store the user's role in state: `userRole: 'admin' | 'manager' | 'employee'`
- Conditionally render tabs based on role
- Pass `userRole` prop to child components

```typescript
// Example role-based tab rendering
const visibleTabs = {
  admin: ['products', 'orders', 'inventory', 'sales', 'testimonials', 'bundles', 'team'],
  manager: ['orders', 'inventory', 'sales'],
  employee: ['orders'] // Quick Sale is a button, not a tab
};
```

### 2. Create EmployeeManagement.tsx

New component for the "Team" tab (admin-only):
- List all employees and managers with their status
- Add new staff (enter email of registered user)
- Assign role (employee or manager)
- Activate/deactivate staff access
- Remove staff access

### 3. Update SalesDashboard.tsx

Add prop to hide profit information:

```typescript
interface Props {
  hideProfitData?: boolean; // true for managers
}
```

When `hideProfitData` is true:
- Hide "Profit" stat card
- Hide profit column in Top Selling Products table
- Hide profit column in Daily Sales table

### 4. Update InventoryDashboard.tsx

Add prop to control what's visible:

```typescript
interface Props {
  userRole: 'admin' | 'manager' | 'employee';
}
```

Based on role:
- **Admin**: See everything
- **Manager**: Hide cost price, profit, inventory value - can adjust stock
- **Employee**: Hide cost price, profit, inventory value - cannot adjust stock

### 5. Update QuickSaleDialog.tsx

No changes needed - all roles can use Quick Sale since it doesn't expose cost prices.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Admin.tsx` | Modify | Add role state, conditional tab rendering, pass role props |
| `src/components/admin/EmployeeManagement.tsx` | Create | Team management component |
| `src/components/admin/SalesDashboard.tsx` | Modify | Add `hideProfitData` prop |
| `src/components/admin/InventoryDashboard.tsx` | Modify | Add `userRole` prop for conditional rendering |

---

## User Experience

### Admin Workflow
1. Navigate to Team tab
2. See list of all staff members
3. Click "Add Staff" and enter email of registered user
4. Select role: Manager or Employee
5. User can now log in with their assigned permissions

### Manager Workflow
1. Log in and access Admin panel
2. See Orders, Inventory, and Sales tabs only
3. Can process Quick Sales
4. Can adjust inventory stock levels
5. Cannot see cost prices or profit data anywhere

### Employee Workflow
1. Log in and access Admin panel
2. See Orders tab only
3. Can process Quick Sales (main function)
4. Can view and update order statuses
5. Cannot see any financial data (cost, profit)

---

## Security Considerations

1. **Role validation is server-side** via `has_role()` function
2. **RLS policies** protect sensitive data at database level
3. **UI restrictions** are supplementary - real security is in RLS
4. **Stock adjustments**: Managers can adjust, employees cannot (enforced by RLS)
5. **Cost prices never sent to frontend** for non-admin roles (future enhancement for maximum security)

