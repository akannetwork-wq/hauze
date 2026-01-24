-- Migration: 0036_accounting_v2.sql
-- Description: Upgrade to Accounting V2 (System Accounts, Checks, Banks, POS)

-- 1. Upgrade 'accounts' table to support System Accounts (Banks, Safes, POS)
-- We need to remove the constraint that forces an account to be linked to a contact or employee.

-- Safely drop the check constraint(s) on accounts table
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT conname 
             FROM pg_constraint 
             WHERE conrelid = 'public.accounts'::regclass 
             AND contype = 'c' -- Check constraints only
    LOOP
        -- We effectively drop the "contact_id OR employee_id" check
        EXECUTE 'ALTER TABLE public.accounts DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- Add new columns to 'accounts'
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'bank', 'safe', 'pos', 'check_portfolio')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create 'checks' table for Check/Promissory Note tracking
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    
    -- Who gave us the check (for Received) or who we gave it to (for Issued)
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- The account currently holding this check (e.g., 101.01 Portfolio)
    portfolio_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    
    type TEXT NOT NULL CHECK (type IN ('received', 'issued')), -- Alınan / Verilen
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'TRY' NOT NULL,
    
    due_date DATE NOT NULL, -- Vade Tarihi
    issue_date DATE DEFAULT CURRENT_DATE, -- Düzenleme Tarihi
    
    serial_number TEXT,
    bank_name TEXT,
    branch_name TEXT,
    
    status TEXT DEFAULT 'portfolio' CHECK (status IN ('portfolio', 'deposited', 'collected', 'bounced', 'returned', 'paid')),
    
    images JSONB DEFAULT '[]'::jsonb, -- Front/Back photos
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for checks
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "Tenant Isolation" ON checks;
CREATE POLICY "Tenant Isolation" ON checks FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM tenant_users WHERE tenant_id = checks.tenant_id)
);

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_checks_tenant ON checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checks_status ON checks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_checks_due_date ON checks(tenant_id, due_date);
