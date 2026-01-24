import { createClient } from '@supabase/supabase-js';
// We use 'require' or simple import. Since we run with tsx, import is fine.

const SUPABASE_URL = 'https://tzalqffhrtncfcmhlowx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YWxxZmZocnRuY2ZjbWhsb3d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg1MTUxNCwiZXhwIjoyMDg0NDI3NTE0fQ.pT-x2E4-kI1sKaQXjrFowGS97ZSXZJXzEOq8f9JaJMI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const args = process.argv.slice(2);
    const target = args[0];

    if (!target) {
        console.log('Listing Tenants:');
        const { data: tenants, error } = await supabase.from('tenants').select('*');
        if (error) {
            console.error('Error fetching tenants:', error);
            return;
        }
        console.table(tenants.map(t => ({ id: t.id, name: t.name, domain: t.domain })));
        console.log('\nUsage: npx tsx scripts/reset-tenant-data.ts <tenant_id>');
        return;
    }

    const tenantId = target;
    console.log(`!!! WARNING !!!`);
    console.log(`Preparing to WIPEOUT ALL DATA for Tenant ID: ${tenantId}`);
    console.log(`This includes: Contacts, Employees, Orders, Products, Inventory, Accounting (Transactions, Accounts).`);
    console.log(`Admin users will remain.`);
    console.log(`Starting in 5 seconds...`);

    await new Promise(pkg => setTimeout(pkg, 5000));

    // Order matters for Foreign Keys if cascade isn't perfect, but service role usually bypasses RLS not FKs.
    // We will delete children first.

    const cleaningSteps = [
        // 0. Cache (Report Cache)
        { table: 'report_cache', label: 'Report Cache' },

        // 1. Finance (Deepest level usually)
        { table: 'transactions', label: 'Accounting Transactions' },

        // 2. WMS & Orders
        { table: 'wms_shipments', label: 'WMS Shipments' },
        { table: 'wms_stock_movements', label: 'WMS Movements' },
        { table: 'wms_stock', label: 'WMS Stock' },
        { table: 'order_items', label: 'Order Items (if exists)' },
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
        // { table: 'product_images', label: 'Product Images' }, // Seems checking this fails often if it's a storage bucket link, but table exists in 0015
        { table: 'product_variations', label: 'Product Variations' }, // in 0014
        { table: 'inventory_items', label: 'Inventory Items' },
        { table: 'products', label: 'Products' },
        { table: 'product_categories', label: 'Product Categories' },
        { table: 'inventory_pools', label: 'Inventory Pools' },

        // 6. Contacts
        { table: 'contacts', label: 'Contacts' }
    ];

    for (const step of cleaningSteps) {
        process.stdout.write(`Cleaning ${step.label} (${step.table})... `);
        try {
            const { error, count } = await supabase
                .from(step.table)
                .delete({ count: 'exact' })
                .eq('tenant_id', tenantId);

            if (error) {
                if (error.code === '42P01') { // undefined_table
                    console.log('Skipped (Table not found)');
                } else {
                    console.error('FAILED:', error.message);
                }
            } else {
                console.log(`Deleted ${count ?? '?'} rows.`);
            }
        } catch (e) {
            console.error('Exception:', e);
        }
    }

    console.log('\nTenant cleanup complete.');
}

main().catch(console.error);
