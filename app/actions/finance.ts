'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedClient } from './auth-helper';

// --- Types ---

export type AccountType = 'standard' | 'bank' | 'safe' | 'pos' | 'check_portfolio' | 'credit_card';

export interface FinanceAccountInput {
    name: string;
    type: AccountType;
    currency: string;
    code?: string; // Optional, auto-generated if missing
    metadata?: any;
}

// --- Actions ---

export async function createFinanceAccount(input: FinanceAccountInput) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Generate code based on type if not provided
        let code = input.code;
        if (!code) {
            const prefixMap: Record<string, string> = {
                'safe': '100',
                'check_portfolio': '101',
                'bank': '102',
                'pos': '108',
                'credit_card': '309'
            };
            const prefix = prefixMap[input.type] || '120';

            // Find next code
            const { data: existing } = await supabase
                .from('accounts')
                .select('code')
                .eq('tenant_id', tenant.id)
                .like('code', `${prefix}.%`)
                .order('code', { ascending: false })
                .limit(1);

            let nextNum = 1;
            if (existing && existing.length > 0) {
                const parts = existing[0].code.split('.');
                if (parts.length > 1) {
                    nextNum = parseInt(parts[parts.length - 1]) + 1;
                }
            }
            code = `${prefix}.${String(nextNum).padStart(2, '0')}`;
        }

        // 2. Create Account
        const { data, error } = await supabase
            .from('accounts')
            .insert({
                tenant_id: tenant.id,
                name: input.name,
                type: input.type,
                currency: input.currency,
                code: code,
                metadata: input.metadata || {},
                // contact_id and employee_id are NULL for system accounts
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/accounting');
        revalidatePath('/admin/accounting/definitions');
        return { success: true, data };
    } catch (error: any) {
        console.error('createFinanceAccount Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getFinanceAccounts(type?: AccountType) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        let query = supabase
            .from('account_with_balances') // Use view to get balances
            .select('*')
            .eq('tenant_id', tenant.id);

        if (type) {
            query = query.eq('type', type);
        } else {
            // Filter to only system types if generic call? 
            // Or let UI filter. Let's return only system types by default if no type generic
            query = query.in('type', ['bank', 'safe', 'pos', 'check_portfolio', 'credit_card']);
        }

        const { data, error } = await query.order('code');

        if (error) throw error;
        return data || [];
    } catch (error: any) {
        console.error('getFinanceAccounts Error:', error);
        return [];
    }
}

export async function deleteFinanceAccount(id: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Check balance first? 
        // Postgres FKs will prevent deletion if transactions exist usually.

        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenant.id);

        if (error) throw error;

        revalidatePath('/admin/accounting');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
// ... deleteFinanceAccount ...

export async function updateFinanceAccount(id: string, input: Partial<FinanceAccountInput>) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.currency) updates.currency = input.currency;
        if (input.metadata) updates.metadata = input.metadata;

        const { data, error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', tenant.id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/admin/accounting');
        revalidatePath('/admin/accounting/definitions');
        return { success: true, data };
    } catch (error: any) {
        console.error('updateFinanceAccount Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Transfers & Specialized Payments ---

export async function transferFunds(input: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    date: string;
    description: string;
}) {
    return processFinanceTransaction({
        type: 'transfer',
        ...input
    });
}

export async function payIssuedCheck(checkId: string, assetAccountId: string, date: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Fetch Check Details
        const { data: check, error: fetchError } = await supabase
            .from('checks')
            .select('*')
            .eq('id', checkId)
            .single();

        if (fetchError || !check) throw new Error('Çek bulunamadı.');
        if (check.type !== 'issued') throw new Error('Bu bir verilen çek değil.');

        // 2. Process Transaction
        // Issued checks are liabilities (Credit balance usually if we track them in a liability acc)
        // Paying them: Debit Check Account, Credit Asset Account
        const res = await processFinanceTransaction({
            type: 'payment',
            amount: Number(check.amount),
            sourceAccountId: assetAccountId, // Money leaves bank/safe (Credit)
            destinationAccountId: check.portfolio_account_id, // Money "enters" check acc to clear liability (Debit)
            date,
            description: `Çek Ödemesi - SN: ${check.serial_number} (${check.bank_name})`
        });

        if (!res.success) throw new Error(res.error);

        // 3. Update Check Status
        await supabase
            .from('checks')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('id', checkId);

        revalidatePath('/admin/accounting');
        return { success: true };
    } catch (error: any) {
        console.error('payIssuedCheck Error:', error);
        return { success: false, error: error.message };
    }
}

export async function collectReceivedCheck(checkId: string, assetAccountId: string, date: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { data: check, error: fetchError } = await supabase
            .from('checks')
            .select('*')
            .eq('id', checkId)
            .single();

        if (fetchError || !check) throw new Error('Çek bulunamadı.');
        if (check.type !== 'received') throw new Error('Bu bir alınan çek değil.');

        // 2. Process Transaction
        // Received checks are assets (Debit balance in portfolio)
        // Collecting them: Debit Bank/Safe, Credit Check Portfolio
        const res = await processFinanceTransaction({
            type: 'collection',
            amount: Number(check.amount),
            sourceAccountId: check.portfolio_account_id, // Money leaves portfolio (Credit)
            destinationAccountId: assetAccountId, // Money enters bank/safe (Debit)
            date,
            description: `Çek Tahsilatı - SN: ${check.serial_number} (${check.bank_name})`
        });

        if (!res.success) throw new Error(res.error);

        // 3. Update Check Status
        await supabase
            .from('checks')
            .update({ status: 'collected', updated_at: new Date().toISOString() })
            .eq('id', checkId);

        revalidatePath('/admin/accounting');
        return { success: true };
    } catch (error: any) {
        console.error('collectReceivedCheck Error:', error);
        return { success: false, error: error.message };
    }
}

export async function payCreditCardDebt(ccAccountId: string, sourceAssetAccountId: string, amount: number, date: string) {
    try {
        // CC Accounts usually have Credit balances (Debt)
        // Paying debt: Debit CC Account, Credit Source Asset Account
        return processFinanceTransaction({
            type: 'payment',
            amount,
            sourceAccountId: sourceAssetAccountId,
            destinationAccountId: ccAccountId,
            date,
            description: 'Kredi Kartı Borç Ödemesi'
        });
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getChecks(options: { type?: 'received' | 'issued', status?: string } = {}) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        let query = supabase
            .from('checks')
            .select('*')
            .eq('tenant_id', tenant.id);

        if (options.type) query = query.eq('type', options.type);
        if (options.status) query = query.eq('status', options.status);

        const { data, error } = await query.order('due_date');

        if (error) throw error;
        return data || [];
    } catch (error: any) {
        console.error('getChecks Error:', error);
        return [];
    }
}

export type TransactionType = 'collection' | 'payment' | 'transfer';

export interface TransactionInput {
    type: TransactionType;
    amount: number;
    sourceAccountId: string; // From where? (Customer for Collection, Bank for Payment)
    destinationAccountId: string; // To where? (Bank for Collection, Supplier for Payment)
    date: string;
    description: string;
    checkDetails?: {
        bankName?: string;
        serialNumber?: string;
        dueDate?: string;
    };
}

export async function processFinanceTransaction(input: TransactionInput) {
    try {
        const { supabase, tenant, user } = await getAuthenticatedClient();

        // Validate
        if (input.amount <= 0) throw new Error('Tutar 0 dan büyük olmalıdır.');
        if (!input.sourceAccountId || !input.destinationAccountId) throw new Error('Hesap seçimi zorunludur.');

        const transactions: any[] = [
            // 1. Source Side (The "From")
            {
                tenant_id: tenant.id,
                account_id: input.sourceAccountId,
                type: 'credit', // Money leaves source
                amount: input.amount,
                date: input.date,
                description: input.description,
                created_by: user.id,
                metadata: {}
            },
            // 2. Destination Side (The "To")
            {
                tenant_id: tenant.id,
                account_id: input.destinationAccountId,
                type: 'debit', // Money enters dest
                amount: input.amount,
                date: input.date,
                description: input.description,
                created_by: user.id,
                metadata: {}
            }
        ];

        // Handle Check Insert if needed (Basic implementation for now)
        if (input.checkDetails && (input.checkDetails.serialNumber)) {
            transactions[0].metadata = { check: input.checkDetails };
            transactions[1].metadata = { check: input.checkDetails };
        }

        const { error } = await supabase.from('transactions').insert(transactions);
        if (error) throw error;

        revalidatePath('/admin/accounting');
        return { success: true };

    } catch (error: any) {
        console.error('processFinanceTransaction Error:', error);
        return { success: false, error: error.message };
    }
}
