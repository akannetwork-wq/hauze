'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { revalidatePath } from 'next/cache';

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

    // Updated comprehensive cleaning list
    const cleaningSteps = [
        // 0. Cache
        { table: 'report_cache', label: 'Report Cache' },

        // 1. Finance
        { table: 'transactions', label: 'Accounting Transactions' },

        // 2. WMS & Orders
        { table: 'wms_shipments', label: 'WMS Shipments' },
        { table: 'wms_stock_movements', label: 'WMS Movements' },
        { table: 'wms_stock', label: 'WMS Stock' },
        { table: 'order_items', label: 'Order Items' },
        { table: 'orders', label: 'Orders' },

        // 3. Accounts
        { table: 'accounts', label: 'Chart of Accounts' },

        // 4. Personnel (HR)
        { table: 'personnel_performance', label: 'Performance Reviews' },
        { table: 'personnel_tasks', label: 'Personnel Tasks' },
        { table: 'personnel_transactions', label: 'Personnel Ledger' },
        { table: 'personnel_attendance', label: 'Attendance Records' },
        { table: 'employees', label: 'Employees' },

        // 5. Inventory & Products
        { table: 'warehouse_locations', label: 'Warehouse Locations' },
        { table: 'prices', label: 'Product Prices' },
        { table: 'product_variations', label: 'Product Variations' },
        { table: 'inventory_items', label: 'Inventory Items' },
        { table: 'products', label: 'Products' },
        { table: 'product_categories', label: 'Product Categories' },
        { table: 'inventory_pools', label: 'Inventory Pools' },

        // 6. Contacts
        { table: 'contacts', label: 'Contacts' }
    ];

    console.log(`Starting reset for tenant: ${tenantId}`);

    for (const step of cleaningSteps) {
        try {
            const { error } = await supabase
                .from(step.table)
                .delete()
                .eq('tenant_id', tenantId);

            if (error) {
                // Ignore "undefined_table" error which is code 42P01
                if (error.code !== '42P01') {
                    console.warn(`Error clearing table ${step.table}:`, error.message);
                }
            } else {
                console.log(`Cleared table: ${step.table}`);
            }
        } catch (err) {
            console.error(`Exception while clearing ${step.table}:`, err);
        }
    }

    revalidatePath('/terminal/tenants');
    return { success: true };
}
