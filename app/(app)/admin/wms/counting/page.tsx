import { getStockAuditList, getWarehouses } from '@/app/actions/wms';
import CountingClient from '@/app/(app)/admin/wms/counting/counting-client';

export default async function CountingPage() {
    const stock = await getStockAuditList();
    const warehouses = await getWarehouses();

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Stok Sayımı</h1>
                    <p className="text-gray-500 font-medium mt-1">Fiziksel stok ile sistem verilerini eşitleme.</p>
                </div>
            </div>

            <CountingClient initialStock={stock} warehouses={warehouses} />
        </div>
    );
}
