import { getWarehouses, getLocations } from '@/app/actions/wms';
import WarehouseClient from '@/app/(app)/admin/wms/warehouses/warehouse-client';
import Link from 'next/link';

export default async function WarehousesPage() {
    const [warehouses, locations] = await Promise.all([
        getWarehouses(),
        getLocations()
    ]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/wms" className="hover:text-indigo-600 transition-colors">WMS</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Depolar & Lokasyonlar</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Depolar ve Lokasyonlar</h1>
                </div>
            </div>

            <WarehouseClient initialWarehouses={warehouses} initialLocations={locations} />
        </div>
    );
}
