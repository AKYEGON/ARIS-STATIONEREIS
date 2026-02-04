-- Create employee_profiles table for storing staff details
CREATE TABLE public.employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage employee profiles
CREATE POLICY "Admins can view employee profiles"
  ON public.employee_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert employee profiles"
  ON public.employee_profiles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employee profiles"
  ON public.employee_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employee profiles"
  ON public.employee_profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Update stock_movements RLS to allow managers to insert
DROP POLICY IF EXISTS "Admins can insert stock movements" ON public.stock_movements;

CREATE POLICY "Admins and managers can insert stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );

-- Allow managers to view stock movements too
DROP POLICY IF EXISTS "Admins can view stock movements" ON public.stock_movements;

CREATE POLICY "Admins and managers can view stock movements"
  ON public.stock_movements FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );

-- Create trigger for updated_at
CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();