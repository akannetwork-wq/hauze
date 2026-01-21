-- =========================================
-- Migration: 0023_accounting_module.sql
-- Description: Core schema for Accounting, Contacts, and Ledger
-- =========================================

-- 1. Contacts (Unified for Customers and Suppliers)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('customer', 'supplier', 'partner')),
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    tax_id TEXT, -- Vergi No
    tax_office TEXT, -- Vergi Dairesi
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    district TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Accounts (Cari Hesaplar)
-- This table links financial entries to either a Contact or an Employee
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g., '120.01.001'
    name TEXT NOT NULL,
    currency TEXT DEFAULT 'TRY' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tenant_id, code),
    CHECK (contact_id IS NOT NULL OR employee_id IS NOT NULL)
);

-- 3. Accounting Transactions (General Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('debit', 'credit')), -- Borç / Alacak
    amount DECIMAL(15,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    description TEXT,
    document_type TEXT, -- invoice, payment, receipt, salary
    document_id UUID,
    created_by UUID, -- auth.uid()
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Standard Isolation Policies
DROP POLICY IF EXISTS "Tenant Isolation" ON contacts;
CREATE POLICY "Tenant Isolation" ON contacts FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = contacts.tenant_id)
);

DROP POLICY IF EXISTS "Tenant Isolation" ON accounts;
CREATE POLICY "Tenant Isolation" ON accounts FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = accounts.tenant_id)
);

DROP POLICY IF EXISTS "Tenant Isolation" ON transactions;
CREATE POLICY "Tenant Isolation" ON transactions FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = transactions.tenant_id)
);

-- 4. Helper Views for Balances
-- These views join tables and calculate balances in SQL for easier frontend consumption

-- Account with Balance
CREATE OR REPLACE VIEW account_with_balances WITH (security_invoker = true) AS
    SELECT 
        a.*,
        COALESCE(SUM(CASE 
            WHEN t.type = 'debit' THEN t.amount 
            WHEN t.type = 'credit' THEN -t.amount 
            ELSE 0 
        END), 0) as balance
    FROM accounts a
    LEFT JOIN transactions t ON a.id = t.account_id
    GROUP BY a.id;

-- Contact with total Balance (sum of all their accounts)
CREATE OR REPLACE VIEW contact_balances WITH (security_invoker = true) AS
    SELECT 
        c.*,
        COALESCE(SUM(CASE 
            WHEN t.type = 'debit' THEN t.amount 
            WHEN t.type = 'credit' THEN -t.amount 
            ELSE 0 
        END), 0) as balance
    FROM contacts c
    LEFT JOIN accounts a ON c.id = a.contact_id
    LEFT JOIN transactions t ON a.id = t.account_id
    GROUP BY c.id;

-- Employee with total Balance
CREATE OR REPLACE VIEW employee_balances WITH (security_invoker = true) AS
    SELECT 
        e.id,
        e.tenant_id,
        e.first_name,
        e.last_name,
        COALESCE(SUM(CASE 
            WHEN t.type = 'debit' THEN t.amount 
            WHEN t.type = 'credit' THEN -t.amount 
            ELSE 0 
        END), 0) as balance
    FROM employees e
    LEFT JOIN accounts a ON e.id = a.employee_id
    LEFT JOIN transactions t ON a.id = t.account_id
    GROUP BY e.id, e.tenant_id, e.first_name, e.last_name;
