-- 0047_link_employee_to_auth.sql

-- 1. Add user_id to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Add unique constraint to ensure one user can only be linked to one employee record per tenant
ALTER TABLE public.employees
DROP CONSTRAINT IF EXISTS employees_user_id_key;

ALTER TABLE public.employees
ADD CONSTRAINT employees_user_id_key UNIQUE (user_id);

-- 3. Update RLS for employees table to allow users to see THEIR OWN record
-- (Existing policy is likely tenant-based, we add a specific one for individual access)
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" ON public.employees
    FOR SELECT USING (auth.uid() = user_id);

-- 4. Similar policies for attendance and transactions so employees can see their own data
DROP POLICY IF EXISTS "Employees can view own attendance" ON public.personnel_attendance;
CREATE POLICY "Employees can view own attendance" ON public.personnel_attendance
    FOR SELECT USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Employees can view own transactions" ON public.personnel_transactions;
CREATE POLICY "Employees can view own transactions" ON public.personnel_transactions
    FOR SELECT USING (
        employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    );
