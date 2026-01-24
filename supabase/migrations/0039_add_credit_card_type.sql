-- Update accounts type check constraint to include 'credit_card'
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE accounts 
    ADD CONSTRAINT accounts_type_check 
    CHECK (type IN ('standard', 'bank', 'safe', 'pos', 'check_portfolio', 'credit_card'));
