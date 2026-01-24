import { getOrdersForWarehouse } from '@/app/actions/wms';
import PickingClient from '@/app/(app)/admin/wms/picking/picking-client';

export default async function PickingPage() {
    const orders = await getOrdersForWarehouse('sale');

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Ürün Toplama</h1>
                    <p className="text-gray-500 font-medium mt-1">Hazırlanması gereken satış siparişleri.</p>
                </div>
            </div>

            <PickingClient initialOrders={orders} />
        </div>
    );
}
