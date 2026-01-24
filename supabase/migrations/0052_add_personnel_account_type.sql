-- Add 'personnel' type to accounts for employee-linked accounts
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE accounts 
    ADD CONSTRAINT accounts_type_check 
    CHECK (type IN ('standard', 'bank', 'safe', 'pos', 'check_portfolio', 'credit_card', 'personnel'));
