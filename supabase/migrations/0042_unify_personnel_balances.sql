-- Migration: 0042_unify_personnel_balances.sql
-- Description: Simplify Net Balance calculation to be purely HR-ledger based.
-- Usage: select('*, get_net_balance') -> returns numeric value.

-- Drop the old view if it exists
DROP VIEW IF EXISTS personnel_balances;

-- Create function
CREATE OR REPLACE FUNCTION get_net_balance(employee_row employees)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        COALESCE((
            SELECT SUM(CASE 
                WHEN type IN ('earning', 'bonus', 'payment') THEN amount 
                WHEN type IN ('advance', 'penalty') THEN -amount 
                ELSE 0 
            END)
            FROM personnel_transactions
            WHERE employee_id = employee_row.id
        ), 0);
$$;
