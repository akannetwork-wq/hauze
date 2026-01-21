import { getWarehouses, getLocations, getWmsStock } from '@/app/actions/wms';
import { getProducts } from '@/app/actions/inventory';
import MovementClient from '@/app/(app)/admin/wms/movements/movement-client';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function MovementsPage() {
    const supabase = await createClient();

    // Fetch necessary data for the form and list
    const [warehouses, locations, products, movements] = await Promise.all([
        getWarehouses(),
        getLocations(),
        getProducts({ status: 'active' }),
        supabase.from('wms_stock_movements').select('*, products(title, sku), from:warehouse_locations!from_location_id(name), to:warehouse_locations!to_location_id(name)').order('created_at', { ascending: false }).limit(50)
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/wms" className="hover:text-indigo-600 transition-colors">WMS</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Stok Hareketleri</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Stok Hareketleri</h1>
                </div>
            </div>

            <MovementClient
                warehouses={warehouses}
                locations={locations}
                products={products}
                initialMovements={movements.data || []}
            />
        </div>
    );
}
