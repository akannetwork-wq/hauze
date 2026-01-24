-- Migration: 0037_fix_account_view.sql
-- Description: Re-create account_with_balances view to include new columns.
-- DROP VIEW needed because we are changing column types/order which OR REPLACE cannot handle.

DROP VIEW IF EXISTS account_with_balances;

CREATE OR REPLACE VIEW account_with_balances WITH (security_invoker = true) AS
    SELECT 
        a.id,
        a.tenant_id,
        a.contact_id,
        a.employee_id,
        a.code,
        a.name,
        a.currency,
        a.type,      -- Added column
        a.metadata,  -- Added column
        a.created_at,
        a.updated_at,
        COALESCE(SUM(CASE 
            WHEN t.type = 'debit' THEN t.amount 
            WHEN t.type = 'credit' THEN -t.amount 
            ELSE 0 
        END), 0) as balance
    FROM accounts a
    LEFT JOIN transactions t ON a.id = t.account_id
    GROUP BY a.id;
