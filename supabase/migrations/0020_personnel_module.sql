-- =========================================
-- Migration: 0020_personnel_module.sql
-- Description: Core schema for Human Resources & Personnel management
-- =========================================

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT, -- e.g., 'Usta', 'Montaj Elemanı', 'Ofis'
    hire_date DATE DEFAULT CURRENT_DATE,
    worker_type TEXT NOT NULL DEFAULT 'monthly' CHECK (worker_type IN ('monthly', 'daily')),
    base_salary DECIMAL(12,2) DEFAULT 0, -- For monthly workers
    daily_rate DECIMAL(12,2) DEFAULT 0,  -- For daily workers
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Attendance (Puantaj)
CREATE TABLE IF NOT EXISTS personnel_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    hours DECIMAL(4,2) DEFAULT 8,
    rate_multiplier DECIMAL(3,2) DEFAULT 1.0, -- 1.0 = normal, 2.0 = double, etc.
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'leave', 'half-day', 'double')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(employee_id, date)
);

-- 3. Personnel Ledger / Transactions (Borç/Alacak)
CREATE TABLE IF NOT EXISTS personnel_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earning', 'advance', 'payment', 'bonus', 'penalty')),
    amount DECIMAL(12,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_by UUID, -- Link to auth.uid()
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Personnel Tasks
CREATE TABLE IF NOT EXISTS personnel_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Performance Metrics
CREATE TABLE IF NOT EXISTS personnel_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    period TEXT NOT NULL, -- e.g., '2026-01'
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_performance ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (Standard Member Access)
CREATE POLICY "Tenant Isolation" ON employees FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = employees.tenant_id)
);
CREATE POLICY "Tenant Isolation" ON personnel_attendance FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = personnel_attendance.tenant_id)
);
CREATE POLICY "Tenant Isolation" ON personnel_transactions FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = personnel_transactions.tenant_id)
);
CREATE POLICY "Tenant Isolation" ON personnel_tasks FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = personnel_tasks.tenant_id)
);
CREATE POLICY "Tenant Isolation" ON personnel_performance FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = personnel_performance.tenant_id)
);

-- 8. Helper View for Current Balance
CREATE OR REPLACE VIEW personnel_balances AS
    SELECT 
        employee_id,
        SUM(CASE 
            WHEN type IN ('earning', 'bonus') THEN amount 
            WHEN type IN ('advance', 'payment', 'penalty') THEN -amount 
            ELSE 0 
        END) as balance
    FROM personnel_transactions
    GROUP BY employee_id;
