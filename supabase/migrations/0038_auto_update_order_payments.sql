-- Create a function to recalculate order payment status
CREATE OR REPLACE FUNCTION public.recalculate_order_payment(target_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total numeric;
    v_paid numeric;
    v_order_type text;
    v_contact_id uuid;
BEGIN
    -- Get Order Details
    SELECT total, type, contact_id INTO v_total, v_order_type, v_contact_id
    FROM orders
    WHERE id = target_order_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Calculate Paid Amount
    -- We sum transactions that are:
    -- 1. Linked to this order (document_id)
    -- 2. Linked to the Contact's Account (to avoid double counting the Asset/Bank side)
    --    OR simply type specific? 
    --    Sale -> Customer Pays -> Credit Customer Account.
    --    Purchase -> We Pay -> Debit Supplier Account.
    --    So we filter by type matches expectation.
    --    Sale -> Type = 'credit' (on any account? No, only Customer account).
    --    But checking Account ownership is complex here.
    --    Simpler: Count transactions where type matches the "Payment Direction".
    --    For Sale: Credit transactions (Reducing AR).
    --    For Purchase: Debit transactions (Reducing AP).
    --    This excludes the Asset side (which is Debit for Sale, Credit for Purchase).
    --    Sale: Asset(Debit), Customer(Credit).
    --    Purchase: Asset(Credit), Supplier(Debit).
    --    So filtering by type is SUFFICIENT distinctness!
    
    SELECT COALESCE(SUM(amount), 0)
    INTO v_paid
    FROM transactions
    WHERE document_type = 'order'
    AND document_id = target_order_id
    AND type = (CASE WHEN v_order_type = 'sale' THEN 'credit' ELSE 'debit' END);

    -- Update Order
    UPDATE orders
    SET 
        paid_amount = v_paid,
        payment_status = (
            CASE 
                WHEN v_paid >= v_total THEN 'paid'
                WHEN v_paid > 0 THEN 'partial'
                ELSE 'pending'
            END
        ),
        updated_at = NOW()
    WHERE id = target_order_id;
END;
$$;

-- Create Trigger Function
CREATE OR REPLACE FUNCTION public.tr_update_order_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        IF (OLD.document_type = 'order') THEN
            PERFORM public.recalculate_order_payment(OLD.document_id);
        END IF;
        RETURN OLD;
    ELSE
        IF (NEW.document_type = 'order') THEN
            PERFORM public.recalculate_order_payment(NEW.document_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;

-- Create Trigger
DROP TRIGGER IF EXISTS update_order_payment_trigger ON transactions;

CREATE TRIGGER update_order_payment_trigger
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION public.tr_update_order_payment_status();

-- Fix existing discrepancies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM orders LOOP
        PERFORM public.recalculate_order_payment(r.id);
    END LOOP;
END;
$$;
