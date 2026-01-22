'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getCurrentContext } from './tenant-context';
import { getAuthenticatedClient } from './auth-helper';


export async function getOrders(options: { type?: 'sale' | 'purchase', status?: string } = {}) {
    try {
        const { supabase, tenant } = await getAuthenticatedClient();

        let query = supabase
            .from('orders')
            .select('*, contacts:contact_id(first_name, last_name, company_name)')
            .eq('tenant_id', tenant.id);

        if (options.type) query = query.eq('type', options.type);
        else query = query.eq('type', 'sale'); // Default to sales for orders module

        if (options.status && options.status !== 'all') {
            query = query.eq('status', options.status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
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
                warehouses:warehouse_id(id, name, key)
            `)
            .eq('id', id)
            .eq('tenant_id', tenant.id)
            .single();

        if (error) throw error;

        // Fetch transitions separately because document_id isn't a formal FK
        const { data: transactions } = await supabase
            .from('transactions')
            .select('id, amount, date, description, metadata')
            .eq('document_id', id)
            .eq('tenant_id', tenant.id);

        return {
            ...order,
            transactions: transactions || []
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

        revalidatePath('/admin/orders');
        revalidatePath(`/admin/orders/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error('updateOrderStatus Error:', error);
        return { success: false, error: error.message };
    }
}

export async function markOrderAsPaid(id: string, method: 'cash' | 'credit_card' | 'eft' | 'check') {
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
        if (order.payment_status === 'paid') throw new Error('Bu sipariş zaten ödenmiş.');

        // 2. Find contact account
        const { data: account } = await supabase
            .from('accounts')
            .select('id')
            .eq('contact_id', order.contact_id)
            .eq('tenant_id', tenant.id)
            .single();

        if (!account) throw new Error('Cari hesap bulunamadı.');

        // 3. Calculate remaining balance
        const total = order.total || 0;
        const paid = order.paid_amount || 0;
        const remaining = total - paid;

        if (remaining <= 0) {
            throw new Error('Siparişin ödenmemiş bakiyesi bulunmuyor.');
        }

        const paymentLabels: Record<string, string> = {
            cash: 'Nakit',
            credit_card: 'Kredi Kartı',
            eft: 'EFT / Havale',
            check: 'Çek'
        };

        // 4. Record Payment Transaction (Only for the remaining amount)
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                tenant_id: tenant.id,
                account_id: account.id,
                type: order.type === 'sale' ? 'credit' : 'debit',
                amount: remaining, // Use remaining balance
                date: new Date().toISOString().split('T')[0],
                description: `${paymentLabels[method] || 'Ödeme'} - Bakiye Kapatma (${order.order_number || order.id.slice(0, 8)})`,
                document_type: 'payment',
                document_id: order.id,
                created_by: user.id,
                metadata: {
                    method,
                    auto_processed: true,
                    full_payment: true,
                    original_total: total,
                    previous_paid: paid
                }
            });

        if (txError) throw txError;

        // 5. Update Order status and paid_amount
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_status: 'paid',
                payment_method: method,
                paid_amount: total, // Now fully paid
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
        console.error('markOrderAsPaid Error:', error);
        return { success: false, error: error.message };
    }
}
