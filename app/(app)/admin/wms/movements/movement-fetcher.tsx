import { getWarehouses, getLocations } from '@/app/actions/wms';
import { getProducts } from '@/app/actions/inventory';
import { getAuthenticatedClient } from '@/app/actions/auth-helper';
import MovementClient from './movement-client';

export default async function MovementFetcher() {
    const { supabase, tenant } = await getAuthenticatedClient();

    const [warehouses, locations, products, movements] = await Promise.all([
        getWarehouses(),
        getLocations(),
        getProducts({ status: 'active' }),
        supabase
            .from('wms_stock_movements')
            .select('*, products(title, sku), from:warehouse_locations!from_location_id(name), to:warehouse_locations!to_location_id(name)')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false })
            .limit(50)
    ]);

    return (
        <MovementClient
            warehouses={warehouses}
            locations={locations}
            products={products}
            initialMovements={movements.data || []}
        />
    );
}
