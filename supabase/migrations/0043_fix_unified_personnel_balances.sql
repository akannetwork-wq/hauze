-- Migration: 0043_fix_unified_personnel_balances.sql
-- Description: Truly unify HR and Financial ledgers for personnel Net Balance.
-- This ensures "Patron View" accuracy: Accrued Earnings - Market/Loan Debts.

CREATE OR REPLACE FUNCTION get_net_balance(employee_row employees)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    WITH hr_sum AS (
        SELECT COALESCE(SUM(CASE 
            WHEN type IN ('earning', 'bonus', 'payment') THEN amount 
            WHEN type IN ('advance', 'penalty') THEN -amount 
            ELSE 0 
        END), 0) as val
        FROM personnel_transactions
        WHERE employee_id = employee_row.id
    ),
    fin_sum AS (
        SELECT COALESCE(SUM(CASE 
            WHEN t.type = 'debit' THEN t.amount 
            WHEN t.type = 'credit' THEN -t.amount 
            ELSE 0 
        END), 0) as val
        FROM accounts a
        JOIN transactions t ON a.id = t.account_id
        WHERE a.employee_id = employee_row.id
    )
    SELECT (SELECT val FROM hr_sum) - (SELECT val FROM fin_sum);
$$;
