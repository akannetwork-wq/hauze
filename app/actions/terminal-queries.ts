'use server';

import { createServiceClient } from '@/lib/supabase/service';

export async function getTenants() {
    const supabase = createServiceClient();

    // We use service client to bypass RLS and get all tenants
    const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tenants:', error);
        return [];
    }

    return data;
}

export async function getModules() {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('key');

    if (error) {
        console.error('Error fetching modules:', error);
        return [];
    }

    return data;
}


export async function resetTenantData(tenantId: string) {
    const supabase = createServiceClient();

    // Define tables to clear in order (child-first to avoid FK errors)
    const tables = [
        'transactions',
        'personnel_actions',
        'leave_requests',
        'attendance',
        'personnel_shifts',
        'stock_movements',
        'inventory',
        'variation_options',
        'variations',
        'orders',
        'personnel',
        'products',
        'accounts',
        'contacts',
        'inventory_pools',
        'stock_orders',
        'warehouses',
        'attribute_definitions'
    ];

    console.log(`Starting reset for tenant: ${tenantId}`);

    for (const table of tables) {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('tenant_id', tenantId);

            if (error) {
                // If table doesn't exist or other error, we log but continue
                console.warn(`Error clearing table ${table}:`, error.message);
            } else {
                console.log(`Cleared table: ${table}`);
            }
        } catch (err) {
            console.error(`Exception while clearing ${table}:`, err);
        }
    }

    return { success: true };
}
