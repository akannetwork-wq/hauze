'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { getAuthenticatedClient } from './auth-helper';


// --- Contacts (Customers/Suppliers/Subcontractors) ---

export async function getContacts(type?: 'customer' | 'supplier' | 'partner' | 'subcontractor', limit = 50, offset = 0, search = '') {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        let query = supabase
            .from('contact_balances')
            .select('*')
            .eq('tenant_id', tenant.id);

        if (type) query = query.eq('type', type);
        if (search) {
            query = query.or(`company_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }

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
            let prefix = '120';
            if (contact.type === 'supplier') prefix = '320';
            else if (contact.type === 'subcontractor') prefix = '321'; // Subcontractors (Taşeron)

            // If partner, maybe 331? But not specified. Default 120?
            // Actually let's assume partner is not main concern now.

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
        revalidatePath('/admin'); // Update dashboard totals
        if (transaction.document_id) revalidatePath(`/admin/orders/${transaction.document_id}`);

        return { success: true, data: tx };
    } catch (error: any) {
        console.error('addTransaction Error:', error.message || error);
        return { success: false, error: error.message };
    }
}

// --- Dashboard Summaries ---

import { getCachedReport, saveReportCache } from './reports';
import { getSalaryStats } from './personnel';

export async function getAccountingSummary(forceRefresh = false) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Disable Cache for Real-time accuracy (User feedback: 2026-01-23)
        /*
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
        */

        // 2. Calculate Fresh (Only if no cache or forced)
        // Get ALL balances (Receivables + Payables)
        // Strictly speaking: Positive = Receivable (Asset), Negative = Payable (Liability)
        const { data: allBalances } = await supabase
            .from('contact_balances')
            .select('balance')
            .eq('tenant_id', tenant.id)
            .neq('balance', 0);

        // console.log('DEBUG: All Balances:', JSON.stringify(allBalances, null, 2));

        let totalReceivables = 0;
        let totalPayables = 0;

        allBalances?.forEach(c => {
            const bal = c.balance || 0;
            if (bal > 0) {
                totalReceivables += bal;
            } else {
                totalPayables += Math.abs(bal);
            }
        });

        // Asset Status (Cash, Bank, POS, Checks, Credit Cards)
        const { data: assetAccounts } = await supabase
            .from('account_with_balances')
            .select('balance, type, code, metadata')
            .eq('tenant_id', tenant.id)
            .in('type', ['safe', 'bank', 'pos', 'check_portfolio', 'credit_card'])
            .or('code.ilike.100%,code.ilike.102%,code.ilike.108%,code.ilike.101%,code.ilike.309%'); // Fallback for old codes

        let totalCash = 0;
        let totalBank = 0;
        let totalBankKMH = 0;
        let totalBankAvailable = 0;
        let totalPos = 0;
        let totalChecks = 0;
        let totalCreditCards = 0;
        let totalCreditCardsLimit = 0;
        let totalCreditCardsAvailable = 0;

        assetAccounts?.forEach(a => {
            const bal = Number(a.balance || 0);

            if (a.type === 'safe' || a.code.startsWith('100')) {
                totalCash += bal;
            }
            else if (a.type === 'bank' || a.code.startsWith('102')) {
                totalBank += bal;
                const kmh = Number(a.metadata?.kmh_limit || 0);
                totalBankKMH += kmh;
                // Available = Balance + KMH (if balance is -500 and KMH is 1000, available is 500)
                // If balance is 1000 and KMH is 1000, available is 2000
                totalBankAvailable += (bal + kmh);
            }
            else if (a.type === 'pos' || a.code.startsWith('108')) {
                totalPos += bal;
            }
            else if (a.type === 'check_portfolio' || a.code.startsWith('101')) {
                totalChecks += bal;
            }
            else if (a.type === 'credit_card' || a.code.startsWith('309')) {
                totalCreditCards += Math.abs(bal); // Debt amount (positive magnitude)
                const limit = Number(a.metadata?.card_limit || 0);
                totalCreditCardsLimit += limit;
                // Available = Limit + Balance (Balance is negative)
                totalCreditCardsAvailable += (limit + bal);
            }
        });

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

        // --- Personnel Balances (NET Calculation) ---
        // Strategy: Use the unified get_net_balance() DB function
        const { data: employees } = await supabase
            .from('employees')
            .select('id, get_net_balance')
            .eq('tenant_id', tenant.id);

        let totalPersonnelReceivable = 0;
        let totalPersonnelJobPayable = 0;

        employees?.forEach((e: any) => {
            const net = Number(e.get_net_balance) || 0;
            // net > 0 means employee OWE us (Earned 10, Bought 12 market -> net is negative? Wait.)
            // Let's re-verify function logic: 
            // HR (Income for them) - Financial (Expense/Debt for them)
            // If they earned 5000 and owes 2000 store -> Net is 3000 (We owe them -> Liability)
            // So for us: Positive Net = Liability, Negative Net = Receivable.

            if (net > 0) {
                totalPersonnelJobPayable += net; // We owe them
            } else if (net < 0) {
                totalPersonnelReceivable += Math.abs(net); // They owe us
            }
        });

        let totalPersonnelPayable = totalPersonnelJobPayable;

        // --- Final Professional Calculations ("Patron View") ---
        const totalTradePayables = totalPayables;
        const totalTradeReceivablesClean = totalReceivables;

        // Equity (Net Worth): What do we actually HAVE minus what we actually OWE.
        // Assets: Cash + Bank (Net) + POS + Checks
        // Receivables: Customers + Personnel (who owe us)
        // Liabilities: Suppliers + Personnel (who we owe) + Credit Card Debt
        const actualAssets = totalCash + totalBank + totalPos + totalChecks;
        const actualReceivables = totalTradeReceivablesClean + totalPersonnelReceivable;
        const actualLiabilities = totalTradePayables + totalPersonnelPayable + totalCreditCards;

        const summary = {
            // Main Stats
            totalReceivables: actualReceivables,
            totalPayables: actualLiabilities, // Unified Liabilities (Trade + Personnel + CC Debt)

            // Asset Breakdown
            totalCash,
            totalBank,
            totalBankKMH,
            totalBankAvailable,
            totalPos,
            totalChecks,

            // Liability Breakdown
            totalCreditCards, // Current CC Debt
            totalCreditCardsLimit,
            totalCreditCardsAvailable,
            totalTradePayables,
            totalPersonnelPayable,

            // Overall Status
            totalAssets: actualAssets,
            // Equity Formula: (Assets + Receivables) - Liabilities
            netBalance: (actualAssets + actualReceivables) - actualLiabilities,

            // Liquidity Formula (Purchasing Power): Cash + KMH + CC Limits + POS + Checks
            availableLiquidity: totalCash + totalBankAvailable + totalCreditCardsAvailable + totalPos + totalChecks,

            activeContacts,
            lastCalculated: new Date().toISOString()
        };

        // 3. Save to Cache for next time
        await saveReportCache('accounting_summary', summary);

        return summary;
    } catch (error) {
        console.error('getAccountingSummary Error:', error);
        return {
            totalReceivables: 0,
            totalPayables: 0,
            totalPersonnelPayable: 0,
            totalCash: 0,
            totalBank: 0,
            totalBankKMH: 0,
            totalBankAvailable: 0,
            totalPos: 0,
            totalChecks: 0,
            totalCreditCards: 0,
            totalCreditCardsLimit: 0,
            totalCreditCardsAvailable: 0,
            totalAssets: 0,
            netBalance: 0,
            availableLiquidity: 0,
            activeContacts: [],
            lastCalculated: null
        };
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

export async function getOpenOrders(id: string, type: 'contact' | 'personnel' = 'contact') {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        let query = supabase
            .from('orders')
            .select('id, total, paid_amount, created_at, type')
            .eq('tenant_id', tenant.id)
            .neq('payment_status', 'paid');

        if (type === 'personnel') {
            query = query.eq('employee_id', id);
        } else {
            query = query.eq('contact_id', id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

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

export async function searchEntities(query: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        // 1. Search Contacts (from contact_balances view)
        const { data: contacts, error: contactError } = await supabase
            .from('contact_balances')
            .select('id, company_name, first_name, last_name, type, balance')
            .eq('tenant_id', tenant.id)
            .or(`company_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
            .limit(5);

        if (contactError) throw contactError;

        // 2. Search Employees
        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('id, first_name, last_name, get_net_balance')
            .eq('tenant_id', tenant.id)
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
            .limit(5);

        if (empError) throw empError;

        const enrichedEmployees = (employees || []).map(e => ({
            id: e.id,
            first_name: e.first_name,
            last_name: e.last_name,
            company_name: null,
            type: 'personnel',
            // net_balance > 0 means company owes employee (Liability/Credit)
            // But search UI usually displays simple balances.
            // Let's keep it consistent: negative value means they owe us? 
            // Wait, for contacts positive is receivable. 
            // Our function returns income-expense. 
            // If they earned 10 and bought 2, result is 8 (we owe them).
            // So +8 is Receivable for THEM, Liability for US.
            // For unified UI, let's flip it so positive = entity owes us (Receivable).
            balance: -(Number(e.get_net_balance) || 0)
        }));

        // 4. Combine results
        return [...(contacts || []), ...enrichedEmployees];
    } catch (error: any) {
        console.error('searchEntities Error:', error);
        return [];
    }
}
