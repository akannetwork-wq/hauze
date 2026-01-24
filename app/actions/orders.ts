'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { getAuthenticatedClient } from './auth-helper';


interface GetOrdersOptions {
    limit?: number;
    status?: string;
    type?: 'sale' | 'purchase';
}

export async function getOrders(options: GetOrdersOptions = {}) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        let query = supabase
            .from('orders')
            .select('*, contacts:contact_id(first_name, last_name, company_name), employees:employee_id(first_name, last_name)')
            .eq('tenant_id', tenant.id);

        if (options.type) query = query.eq('type', options.type);
        // else query = query.eq('type', 'sale'); // Removed to show all orders in dashboard

        if (options.status && options.status !== 'all') {
            query = query.eq('status', options.status);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data: orders, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        if (!orders || orders.length === 0) return [];

        // Fetch all transactions for these orders in one query
        const orderIds = orders.map(o => o.id);
        const { data: allTransactions } = await supabase
            .from('transactions')
            .select('document_id, amount, type')
            .in('document_id', orderIds)
            .eq('tenant_id', tenant.id);

        // Calculate payment status for each order
        return orders.map(order => {
            const orderTxs = (allTransactions || []).filter(t => t.document_id === order.id);
            const orderType = order.type || 'sale';
            const targetType = (orderType === 'sale' || orderType === 'service') ? 'credit' : 'debit';

            const calculatedPaid = orderTxs
                .filter(t => t.type === targetType)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const calculatedStatus =
                calculatedPaid >= (order.total || 0) ? 'paid' :
                    calculatedPaid > 0 ? 'partial' : 'pending';

            return {
                ...order,
                paid_amount: calculatedPaid,
                payment_status: calculatedStatus
            };
        });
    } catch (error: any) {
        console.error('getOrders Error:', error.message || error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return [];
    }
}

export async function getOrder(id: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                contacts:contact_id(*),
                employees:employee_id(*),
                warehouses:warehouse_id(id, name, key)
            `)
            .eq('id', id)
            .eq('tenant_id', tenant.id)
            .single();

        if (error) throw error;

        // Fetch transitions separately because document_id isn't a formal FK
        // Fetch associated transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('id, amount, date, description, metadata, type')
            .eq('document_id', id)
            .eq('tenant_id', tenant.id);

        // Calculate real status from transactions to ensure consistency
        const txs = transactions || [];
        const orderType = order.type || 'sale';
        const targetType = (orderType === 'sale' || orderType === 'service') ? 'credit' : 'debit';

        const calculatedPaid = txs
            .filter((t: any) => t.type === targetType)
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const calculatedStatus =
            calculatedPaid >= (order.total || 0) ? 'paid' :
                calculatedPaid > 0 ? 'partial' : 'pending';

        return {
            ...order,
            paid_amount: calculatedPaid,
            payment_status: calculatedStatus,
            transactions: txs
        };
    } catch (error: any) {
        console.error('getOrder Error:', error.message || error);
        return null;
    }
}

export async function updateOrderStatus(id: string, status: string) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        const { error } = await supabase
            .from('orders')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenant.id);

        if (error) throw error;

        // --- STOCK SYNC POINT: Trigger stock movement on delivery ---
        const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
        if (order && order.type === 'purchase' && (status === 'delivered' || status === 'completed')) {
            const { recordMovement } = await import('./wms');
            for (const item of (order.lines || [])) {
                await recordMovement({
                    product_id: item.productId,
                    type: 'IN',
                    quantity: item.quantity,
                    to_location_id: order.warehouse_id, // Ideally resolve location but warehouse works as fallback
                    reference_type: 'order',
                    reference_id: order.id,
                    description: `Stok Girişi (Teslim Alındı) - Sipariş #${order.id.slice(0, 8)}`
                });
            }
        }
        // -------------------------------------------------------------

        revalidatePath('/admin/orders');
        revalidatePath(`/admin/orders/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error('updateOrderStatus Error:', error);
        return { success: false, error: error.message };
    }
}

export async function registerOrderPayment(
    id: string,
    amount: number,
    method: 'cash' | 'credit_card' | 'eft' | 'check',
    targetAccountId?: string,
    checkDetails?: any
) {
    try {
        const { supabase, tenant, user } = await getAuthenticatedClient();

        // 1. Get the order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenant.id)
            .single();

        if (orderError || !order) throw new Error('Sipariş bulunamadı.');

        // 2. Validate amount
        const total = order.total || 0;
        const previouslyPaid = order.paid_amount || 0;
        const remaining = total - previouslyPaid;

        if (amount <= 0) throw new Error('Ödeme tutarı 0\'dan büyük olmalıdır.');
        // Allow slightly more for rounding differences? Strict for now.
        // if (amount > remaining) throw new Error(`Ödeme tutarı kalan bakiyeden (${remaining}) büyük olamaz.`);

        // 3. Find contact/personnel account (Source of payment for Sales, Destination for Purchases)
        let accountQuery = supabase
            .from('accounts')
            .select('id')
            .eq('tenant_id', tenant.id);

        if (order.employee_id) {
            accountQuery = accountQuery.eq('employee_id', order.employee_id);
        } else {
            accountQuery = accountQuery.eq('contact_id', order.contact_id);
        }

        const { data: existingAccount } = await accountQuery.maybeSingle();
        let contactAccountId = existingAccount?.id;

        // Auto-create if missing (Copying logic from createServiceOrder)
        if (!contactAccountId) {
            console.log('[registerOrderPayment] No existing account found, creating new one...');
            if (order.employee_id) {
                const prefix = '135';
                const { count } = await supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).like('code', `${prefix}.%`);
                const nextCode = `${prefix}.01.${String((count || 0) + 1).padStart(3, '0')}`;

                const { data: emp } = await supabase.from('employees').select('first_name, last_name').eq('id', order.employee_id).single();
                const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Bilinmeyen Personel';

                console.log('[registerOrderPayment] Creating employee account:', { nextCode, empName, employee_id: order.employee_id });

                const { data: newAcc, error: accError } = await supabase.from('accounts').insert({
                    tenant_id: tenant.id,
                    employee_id: order.employee_id,
                    code: nextCode,
                    name: empName,
                    currency: 'TRY',
                    type: 'personnel'
                }).select().single();

                console.log('[registerOrderPayment] Account creation result:', { newAcc, accError });

                if (accError) {
                    console.error('[registerOrderPayment] Account creation failed:', accError);
                }

                if (newAcc) contactAccountId = newAcc.id;
            } else if (order.contact_id) {
                const { data: cont } = await supabase.from('contacts').select('type, company_name, first_name, last_name').eq('id', order.contact_id).single();
                if (cont) {
                    let prefix = '120';
                    if (cont.type === 'supplier') prefix = '320';
                    else if (cont.type === 'subcontractor') prefix = '321';

                    const { count } = await supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).like('code', `${prefix}.%`);
                    const nextCode = `${prefix}.01.${String((count || 0) + 1).padStart(3, '0')}`;
                    const contName = cont.company_name || `${cont.first_name} ${cont.last_name}`;

                    const { data: newAcc } = await supabase.from('accounts').insert({
                        tenant_id: tenant.id,
                        contact_id: order.contact_id,
                        code: nextCode,
                        name: contName,
                        currency: 'TRY'
                    }).select().single();

                    if (newAcc) contactAccountId = newAcc.id;
                }
            }
        }

        if (!contactAccountId) throw new Error('Cari hesap bulunamadı ve oluşturulamadı.');

        // 4. Validate Target Account (Bank/Safe/POS)
        // If not provided, we should ideally fail or find a default.
        // For backward compatibility, if logic allows, we might skip, but V2 requires it.
        if (!targetAccountId) throw new Error('Lütfen tahsilatın/ödemenin yapılacağı kasa veya bankayı seçin.');

        const paymentLabels: Record<string, string> = {
            cash: 'Nakit',
            credit_card: 'Kredi Kartı',
            eft: 'EFT / Havale',
            check: 'Çek'
        };

        const description = `${paymentLabels[method] || 'Ödeme'} - ${order.order_number || order.id.slice(0, 8)}`;

        // 5. Create Double-Entry Transactions
        const transactions: any[] = [];
        const isSale = order.type === 'sale' || order.type === 'service';

        // Transaction A: Contact Account Effect
        // Sale: Customer PAYS -> Credit Customer (They owe less)
        // Purchase: We PAY Supplier -> Debit Supplier (We owe less)
        transactions.push({
            tenant_id: tenant.id,
            account_id: contactAccountId,
            type: isSale ? 'credit' : 'debit',
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            description: description,
            document_type: 'order',
            document_id: order.id,
            created_by: user.id,
            metadata: { method, check: checkDetails }
        });

        // Transaction B: Asset Account Effect (Bank/Safe)
        // Sale: We RECEIVE money -> Debit Cash/Bank (Asset increases)
        // Purchase: We GIVE money -> Credit Cash/Bank (Asset decreases)
        transactions.push({
            tenant_id: tenant.id,
            account_id: targetAccountId,
            type: isSale ? 'debit' : 'credit',
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            description: description,
            document_type: 'order',
            document_id: order.id,
            created_by: user.id,
            metadata: { method, check: checkDetails }
        });

        const { error: txError } = await supabase.from('transactions').insert(transactions);
        if (txError) throw txError;

        // NOTE: We intentionally do NOT insert into personnel_transactions for payments.
        // The payment is already tracked via transactions (credit to employee account).
        // Inserting to personnel_transactions would cause double-credit since
        // get_net_balance() sums BOTH sources.

        // 6. Recalculate and Update Order Status
        const { data: allTxs } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('document_id', id)
            .eq('document_type', 'order')
            .eq('tenant_id', tenant.id);

        const targetType = (order.type === 'sale' || order.type === 'service') ? 'credit' : 'debit';
        const realPaid = (allTxs || [])
            .filter(t => t.type === targetType)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const newStatus = realPaid >= total ? 'paid' : realPaid > 0 ? 'partial' : 'pending';

        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_status: newStatus,
                paid_amount: realPaid,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenant.id);

        if (updateError) throw updateError;

        revalidatePath('/admin/orders');
        revalidatePath(`/admin/orders/${id}`);
        revalidatePath('/admin/accounting');

        return { success: true };
    } catch (error: any) {
        console.error('registerOrderPayment Error:', error);
        return { success: false, error: error.message };
    }
}

export async function markOrderAsPaid(id: string, method: 'cash' | 'eft' | 'credit_card' | 'check' = 'eft') {
    console.log('[markOrderAsPaid] Starting for order:', id, 'method:', method);
    try {
        const { supabase, tenant } = await getAuthenticatedClient();
        console.log('[markOrderAsPaid] Got auth client');

        // 1. Get Order
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('total, paid_amount')
            .eq('id', id)
            .single();

        console.log('[markOrderAsPaid] Order fetch result:', { order, orderErr });

        if (!order) throw new Error('Sipariş bulunamadı.');

        const amount = (order.total || 0) - (order.paid_amount || 0);
        if (amount <= 0) return { success: true, message: 'Sipariş zaten ödenmiş.' };

        // 2. Find Default Account
        const methodToType = {
            'cash': 'safe',
            'eft': 'bank',
            'credit_card': 'pos',
            'check': 'check_portfolio'
        };
        const targetType = methodToType[method];

        const { data: defaultAcc } = await supabase
            .from('accounts')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('type', targetType)
            .limit(1)
            .maybeSingle();

        let targetAccountId = defaultAcc?.id;

        // If no account, create one?
        if (!targetAccountId) {
            // Create default?
            const labels: Record<string, string> = { safe: 'Merkez Kasa', bank: 'Varsayılan Banka', pos: 'Merkez POS', check_portfolio: 'Çek Portföyü' };
            const codes: Record<string, string> = { safe: '100.01', bank: '102.01', pos: '108.01', check_portfolio: '101.01' };

            const { data: newAcc, error: createError } = await supabase
                .from('accounts')
                .insert({
                    tenant_id: tenant.id,
                    name: labels[targetType] || 'Varsayılan Hesap',
                    type: targetType,
                    code: codes[targetType] || '100.99',
                    currency: 'TRY'
                })
                .select('id')
                .single();

            if (createError) throw new Error(`Varsayılan ${labels[targetType]} hesabı bulunamadı ve oluşturulamadı.`);
            targetAccountId = newAcc.id;
        }

        // 3. Register Payment
        return await registerOrderPayment(id, amount, method, targetAccountId);

    } catch (error: any) {
        console.error('markOrderAsPaid Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deductOrderFromSalary(id: string) {
    try {
        const { supabase, tenant, user } = await getAuthenticatedClient();

        // 1. Get Order
        const { data: order } = await supabase
            .from('orders')
            .select('*, employees:employee_id(*)')
            .eq('id', id)
            .single();

        if (!order) throw new Error('Sipariş bulunamadı.');
        if (!order.employee_id) throw new Error('Bu işlem sadece personel siparişleri için geçerlidir.');

        // 2. Just Mark as Paid
        // We DON'T create any transaction.
        // The Financial Debt (Sales Transaction) remains open.
        // It will be netted against Salary when "Salary Payment Day" comes.

        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_status: 'paid',
                paid_amount: order.total, // Visual update
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        revalidatePath('/admin/orders');
        revalidatePath(`/admin/orders/${id}`);
        revalidatePath('/admin/personnel');

        return { success: true };

    } catch (error: any) {
        console.error('deductOrderFromSalary Error:', error);
        return { success: false, error: error.message };
    }
}
export async function createServiceOrder(data: {
    contact_id?: string;
    employee_id?: string;
    items: any[];
    total: number;
    currency: string;
    notes?: string;
    paymentMethod?: 'eft' | 'cash' | 'credit_card' | 'check';
    paymentAccountId?: string;
    checkDetails?: { bankName: string; serialNumber: string; dueDate: string };
}) {
    try {
        const { supabase, tenant, user } = await getAuthenticatedClient();

        // Explicit payment check to avoid truthy edge cases
        const hasPaidNow = !!(data.paymentMethod && data.paymentMethod.length > 0);

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                tenant_id: tenant.id,
                contact_id: data.contact_id || null,
                employee_id: data.employee_id || null,
                type: 'service',
                status: 'pending',
                payment_method: hasPaidNow ? data.paymentMethod : null,
                payment_status: hasPaidNow ? 'paid' : 'pending',
                currency: data.currency,
                total: data.total,
                paid_amount: hasPaidNow ? data.total : 0,
                notes: data.notes,
                lines: data.items.map(i => ({ ...i, quantity: i.quantity || 1 })), // Ensure quantity
                created_by: user.id
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create Order Items (for detailed reporting/metadata)
        const orderItems = data.items.map(item => ({
            tenant_id: tenant.id,
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity || 1,
            unit_price: item.price,
            total_price: (item.quantity || 1) * item.price,
            service_values: item.values || {} // The smart input values
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        // order_items might not exist yet if not fully migrated, but we attempt it.
        if (itemsError) console.warn('Order items insert skipped/failed:', itemsError.message);

        // 3. Create Accounting Transaction (Receivable)
        // Sale: Debit Customer (Asset increases) / Credit Sales (Revenue increases)
        // For simplicity, we just debit the customer balance.

        // Find or Create entity account
        let accountId = '';

        let accountQuery = supabase
            .from('accounts')
            .select('id')
            .eq('tenant_id', tenant.id);

        if (data.employee_id) {
            accountQuery = accountQuery.eq('employee_id', data.employee_id);
        } else {
            accountQuery = accountQuery.eq('contact_id', data.contact_id);
        }

        const { data: existingAccount } = await accountQuery.maybeSingle();

        if (existingAccount) {
            accountId = existingAccount.id;
        } else if (data.employee_id) {
            // Auto-create account for Employee (135 - Personel)
            const prefix = '135';
            const { count } = await supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).like('code', `${prefix}.%`);
            const nextCode = `${prefix}.01.${String((count || 0) + 1).padStart(3, '0')}`;

            // Get employee name
            const { data: emp } = await supabase.from('employees').select('first_name, last_name').eq('id', data.employee_id).single();
            const empName = emp ? `${emp.first_name} ${emp.last_name}` : 'Bilinmeyen Personel';

            const { data: newAcc } = await supabase.from('accounts').insert({
                tenant_id: tenant.id,
                employee_id: data.employee_id,
                code: nextCode,
                name: empName,
                currency: 'TRY',
                type: 'personnel'
            }).select().single();

            if (newAcc) accountId = newAcc.id;
        } else if (data.contact_id) {
            // Auto-create for Contact if missing (Fallback 120)
            const { data: cont } = await supabase.from('contacts').select('type, company_name, first_name, last_name').eq('id', data.contact_id).single();
            if (cont) {
                let prefix = '120';
                if (cont.type === 'supplier') prefix = '320';
                else if (cont.type === 'subcontractor') prefix = '321';

                const { count } = await supabase.from('accounts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).like('code', `${prefix}.%`);
                const nextCode = `${prefix}.01.${String((count || 0) + 1).padStart(3, '0')}`;

                const contName = cont.company_name || `${cont.first_name} ${cont.last_name}`;

                const { data: newAcc } = await supabase.from('accounts').insert({
                    tenant_id: tenant.id,
                    contact_id: data.contact_id,
                    code: nextCode,
                    name: contName,
                    currency: 'TRY'
                }).select().single();

                if (newAcc) accountId = newAcc.id;
            }
        }

        if (accountId) {
            // Transaction 1: Receivable (Debit Customer/Employee)
            await supabase.from('transactions').insert({
                tenant_id: tenant.id,
                account_id: accountId,
                type: 'debit',
                amount: data.total,
                date: new Date().toISOString().split('T')[0],
                description: `Hizmet Siparişi - #${order.id.slice(0, 8)}`,
                document_type: 'order',
                document_id: order.id,
                created_by: user.id
            });

            // Transaction 2 & 3: Payment (If cash/eft etc.)
            if (data.paymentMethod) {
                // Clear customer receivable (Credit Account)
                await supabase.from('transactions').insert({
                    tenant_id: tenant.id,
                    account_id: accountId,
                    type: 'credit',
                    amount: data.total,
                    date: new Date().toISOString().split('T')[0],
                    description: `Tahsilat (Hizmet) - #${order.id.slice(0, 8)}`,
                    document_type: 'payment',
                    document_id: order.id,
                    created_by: user.id
                });

                // Asset Increase (Debit Safe/Bank)
                if (data.paymentAccountId) {
                    await supabase.from('transactions').insert({
                        tenant_id: tenant.id,
                        account_id: data.paymentAccountId,
                        type: 'debit',
                        amount: data.total,
                        date: new Date().toISOString().split('T')[0],
                        description: `Hizmet Tahsilatı - #${order.id.slice(0, 8)}`,
                        document_type: 'payment',
                        document_id: order.id,
                        created_by: user.id
                    });
                }
            }
        }

        // NOTE: We intentionally do NOT insert into personnel_transactions here.
        // The debt is already tracked via the accounts/transactions financial ledger.
        // Inserting to personnel_transactions would cause double-charging since
        // get_net_balance() sums BOTH hr_sum (personnel_transactions) AND fin_sum (transactions).

        revalidatePath('/admin/orders');
        return { success: true, data: order };
    } catch (error: any) {
        console.error('createServiceOrder Error:', error);
        return { success: false, error: error.message };
    }
}
