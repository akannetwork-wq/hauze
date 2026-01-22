'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';

async function getAuthenticatedClient() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) throw new Error('Unauthorized');

    const context = await getCurrentContext();
    if (!context) throw new Error('No tenant context');

    return { supabase, user, tenant: context.tenant };
}

// --- Contacts (Customers/Suppliers) ---

export async function getContacts(type?: 'customer' | 'supplier' | 'partner', limit = 50, offset = 0) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        let query = supabase
            .from('contact_balances')
            .select('*')
            .eq('tenant_id', tenant.id);

        if (type) query = query.eq('type', type);

        const { data, error } = await query
            .order('company_name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('getContacts Database Error:', JSON.stringify(error, null, 2));
            throw error;
        }
        return data || [];
    } catch (error: any) {
        console.error('getContacts Exception:', error.message || JSON.stringify(error, null, 2));
        return [];
    }
}

export async function saveContact(contact: any) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('contacts')
            .upsert({
                ...contact,
                tenant_id: tenant.id,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-create an account for the contact if it's new
        if (!contact.id) {
            const prefix = contact.type === 'customer' ? '120' : '320';
            const count = await supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).like('code', `${prefix}.%`);
            const nextCode = `${prefix}.01.${String((count.count || 0) + 1).padStart(3, '0')}`;

            await supabase.from('accounts').insert({
                tenant_id: tenant.id,
                contact_id: data.id,
                code: nextCode,
                name: data.company_name || `${data.first_name} ${data.last_name}`,
                currency: 'TRY'
            });
        }

        revalidatePath('/admin/accounting');
        return { success: true, data };
    } catch (error: any) {
        console.error('saveContact Error:', error);
        return { success: false, error: error.message };
    }
}

// --- Financial Ledger ---

export async function getAccounts() {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        const { data, error } = await supabase
            .from('account_with_balances')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('code');

        if (error) {
            console.error('getAccounts Database Error:', JSON.stringify(error, null, 2));
            throw error;
        }
        return data || [];
    } catch (error: any) {
        console.error('getAccounts Exception:', error.message || JSON.stringify(error, null, 2));
        return [];
    }
}

export async function getTransactions(accountId?: string, limit = 100, offset = 0) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('tenant_id', tenant.id);

        if (accountId) query = query.eq('account_id', accountId);

        const { data, error } = await query
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getTransactions Error:', error);
        return [];
    }
}

export async function addTransaction(transaction: any) {
    try {
        const { supabase, tenant, user } = await getAuthenticatedClient();

        console.log('[Accounting] Adding transaction:', JSON.stringify({
            ...transaction,
            tenant_id: tenant.id,
            created_by: user.id
        }, null, 2));

        const { data: tx, error } = await supabase
            .from('transactions')
            .insert({
                ...transaction,
                tenant_id: tenant.id,
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('[Accounting] Supabase Error adding transaction:', JSON.stringify(error, null, 2));
            throw error;
        }

        // --- Order Payment Logic ---
        // If this transaction is linked to an order, update the order's paid amount
        if (transaction.document_id && transaction.document_type === 'payment') {
            const { data: order } = await supabase
                .from('orders')
                .select('id, total, paid_amount')
                .eq('id', transaction.document_id)
                .single();

            if (order) {
                // Get all payments for this order to ensure consistency
                const { data: payments } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('document_id', order.id)
                    .eq('document_type', 'payment');

                const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

                let newStatus: 'pending' | 'partial' | 'paid' = 'pending';
                if (totalPaid >= Number(order.total)) {
                    newStatus = 'paid';
                } else if (totalPaid > 0) {
                    newStatus = 'partial';
                }

                await supabase
                    .from('orders')
                    .update({
                        paid_amount: totalPaid,
                        payment_status: newStatus
                    })
                    .eq('id', order.id);
            }
        }

        console.log('[Accounting] Transaction added successfully:', tx.id);

        revalidatePath('/admin/accounting');
        revalidatePath('/admin/accounting/customers');
        revalidatePath('/admin/accounting/suppliers');
        revalidatePath('/admin/orders');
        if (transaction.document_id) revalidatePath(`/admin/orders/${transaction.document_id}`);

        return { success: true, data: tx };
    } catch (error: any) {
        console.error('addTransaction Error:', error.message || error);
        return { success: false, error: error.message };
    }
}

// --- Dashboard Summaries ---

import { getCachedReport, saveReportCache } from './reports';

export async function getAccountingSummary(forceRefresh = false) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Try Cache First
        if (!forceRefresh) {
            const cached = await getCachedReport('accounting_summary');
            if (cached) {
                const lastUpdated = new Date(cached.updated_at).getTime();
                const now = new Date().getTime();
                const oneDay = 24 * 60 * 60 * 1000;

                // If cache is less than 1 day old, return it
                if (now - lastUpdated < oneDay) {
                    return cached.data;
                }
            }
        }

        // 2. Calculate Fresh (Only if no cache or forced)
        // Total Receivables (Customers with positive balance)
        const { data: receivables } = await supabase
            .from('contact_balances')
            .select('balance')
            .eq('tenant_id', tenant.id)
            .eq('type', 'customer')
            .gt('balance', 0);

        // Total Payables (Suppliers with positive balance/credit)
        const { data: payables } = await supabase
            .from('contact_balances')
            .select('balance')
            .eq('tenant_id', tenant.id)
            .eq('type', 'supplier');

        const totalReceivables = (receivables || []).reduce((sum, c) => sum + (c.balance || 0), 0);
        const totalPayables = (payables || []).reduce((sum, c) => sum + Math.abs(Math.min(c.balance || 0, 0)), 0);

        // Cash Status (Accounts in 100 series usually)
        const { data: cashAccounts } = await supabase
            .from('account_with_balances')
            .select('balance')
            .eq('tenant_id', tenant.id)
            .like('code', '100%'); // Kasalar

        const totalCash = (cashAccounts || []).reduce((sum, a) => sum + (a.balance || 0), 0);

        // --- Active Contacts this Month ---
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: activeAccountIds } = await supabase
            .from('transactions')
            .select('account_id')
            .eq('tenant_id', tenant.id)
            .gte('date', startOfMonth.toISOString());

        const uniqueAccountIds = [...new Set((activeAccountIds || []).map(t => t.account_id))];

        let activeContacts: any[] = [];
        if (uniqueAccountIds.length > 0) {
            const { data: accounts } = await supabase
                .from('accounts')
                .select('contact_id')
                .in('id', uniqueAccountIds)
                .not('contact_id', 'is', null);

            const uniqueContactIds = [...new Set((accounts || []).map(a => a.contact_id))];

            if (uniqueContactIds.length > 0) {
                const { data: contacts } = await supabase
                    .from('contact_balances')
                    .select('*')
                    .in('id', uniqueContactIds)
                    .order('balance', { ascending: false })
                    .limit(10);
                activeContacts = contacts || [];
            }
        }

        const summary = {
            totalReceivables,
            totalPayables,
            totalCash,
            netStatus: totalReceivables - totalPayables + totalCash,
            activeContacts,
            lastCalculated: new Date().toISOString()
        };

        // 3. Save to Cache for next time
        await saveReportCache('accounting_summary', summary);

        return summary;
    } catch (error) {
        console.error('getAccountingSummary Error:', error);
        return { totalReceivables: 0, totalPayables: 0, totalCash: 0, netStatus: 0, activeContacts: [], lastCalculated: null };
    }
}

// --- Contact Details & Transactions ---

export async function getContactDetail(id: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Get Contact (from contact_balances to include balance)
        const { data: contact, error: contactError } = await supabase
            .from('contact_balances')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenant.id)
            .single();

        if (contactError) throw contactError;

        // 2. Get associated Account
        const { data: accounts, error: accountError } = await supabase
            .from('accounts')
            .select('*')
            .eq('contact_id', id)
            .eq('tenant_id', tenant.id);

        const account = accounts && accounts.length > 0 ? accounts[0] : null;

        // 3. Calculate Totals (Debit/Credit)
        let totalDebit = 0;
        let totalCredit = 0;

        if (account) {
            const { data: totals } = await supabase
                .from('transactions')
                .select('type, amount')
                .eq('account_id', account.id)
                .eq('tenant_id', tenant.id);

            totals?.forEach(t => {
                if (t.type === 'debit') totalDebit += Number(t.amount);
                if (t.type === 'credit') totalCredit += Number(t.amount);
            });
        }

        return {
            contact,
            account,
            totals: {
                debit: totalDebit,
                credit: totalCredit
            }
        };
    } catch (error) {
        console.error('getContactDetail Error:', error);
        return null;
    }
}

export async function getOpenOrders(contactId: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { data, error } = await supabase
            .from('orders')
            .select('id, total, paid_amount, created_at, type')
            .eq('contact_id', contactId)
            .eq('tenant_id', tenant.id)
            .neq('payment_status', 'paid')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getOpenOrders Error:', error);
        return [];
    }
}

export async function getContactOrders(contactId: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // Use contact_id as renamed in 0025_bridge_schema.sql
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('contact_id', contactId)
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false });

        if (error) {
            // If orders table or customer_id column doesn't exist, return empty
            if (error.code === '42P01' || error.code === '42703') return [];
            throw error;
        }
        return data || [];
    } catch (error: any) {
        console.error('getContactOrders Error:', error.message || error);
        return [];
    }
}

export async function getContactTransactions(contactId: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Get the account(s) associated with this contact
        const { data: accounts } = await supabase
            .from('accounts')
            .select('id')
            .eq('contact_id', contactId)
            .eq('tenant_id', tenant.id);

        if (!accounts || accounts.length === 0) return [];

        const accountIds = accounts.map(a => a.id);

        // 2. Get transactions for these accounts
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .in('account_id', accountIds)
            .eq('tenant_id', tenant.id)
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('getContactTransactions Error:', error);
        return [];
    }
}
