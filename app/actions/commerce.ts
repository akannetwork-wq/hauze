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

// --- Prices (Products) Management ---

export async function getPrices() {
    const { supabase, tenant } = await getAuthenticatedClient();

    const { data, error } = await supabase
        .from('prices')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('sku');

    if (error) return [];
    return data;
}

export async function createPrice(formData: FormData) {
    const { supabase, tenant } = await getAuthenticatedClient();

    const sku = formData.get('sku') as string;
    const amountStr = formData.get('amount') as string;
    const amount = parseFloat(amountStr);
    const currency = formData.get('currency') as string || 'TRY';
    const listKey = formData.get('list_key') as string || 'standard';

    if (!sku || isNaN(amount)) {
        console.error('Invalid input for createPrice:', { sku, amountStr });
        return { error: 'Invalid input' };
    }

    const { error } = await supabase
        .from('prices')
        .upsert({
            tenant_id: tenant.id,
            sku,
            amount,
            currency,
            list_key: listKey
        }, { onConflict: 'tenant_id, sku, list_key, currency' });

    if (error) {
        console.error('createPrice database error:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/inventory');
    revalidatePath('/admin/accounting');
    return { success: true };
}

// --- Inventory Management ---

export async function getInventory() {
    const { supabase, tenant } = await getAuthenticatedClient();

    const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('tenant_id', tenant.id);

    if (error) return {};

    // Group and aggregate by SKU
    const aggregated: Record<string, any> = {};
    data.forEach((item: any) => {
        const upSku = item.sku.toUpperCase();
        if (!aggregated[upSku]) {
            aggregated[upSku] = { ...item };
        } else {
            const currentQty = (aggregated[upSku].state as any)?.on_hand || 0;
            const itemQty = (item.state as any)?.on_hand || 0;
            aggregated[upSku].state = { on_hand: currentQty + itemQty };
        }
    });

    return aggregated;
}

export async function updateStock(sku: string, quantity: number, variantId?: string) {
    const { supabase, tenant } = await getAuthenticatedClient();

    // 1. Get Main Warehouse Pool (or create if missing - simple Logic)
    let { data: pool } = await supabase
        .from('inventory_pools')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('key', 'main')
        .single();

    if (!pool) {
        const { data: newPool } = await supabase
            .from('inventory_pools')
            .insert({
                tenant_id: tenant.id,
                key: 'main',
                strategy: 'stock'
            })
            .select()
            .single();
        pool = newPool;
    }

    if (!pool) return { error: 'Could not resolve inventory pool' };

    // 2. Upsert Item
    const { error } = await supabase
        .from('inventory_items')
        .upsert({
            tenant_id: tenant.id,
            pool_id: pool.id,
            sku,
            variant_id: variantId || null,
            state: { on_hand: quantity }
        }, { onConflict: 'tenant_id, pool_id, sku' });

    if (error) return { error: error.message };

    revalidatePath('/admin/shop');
    return { success: true };
}
