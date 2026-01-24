import { getOrdersForWarehouse } from '@/app/actions/wms';
import ReceivingClient from '@/app/(app)/admin/wms/receiving/receiving-client';

export default async function ReceivingPage() {
    const orders = await getOrdersForWarehouse('purchase');

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mal Kabul</h1>
                    <p className="text-gray-500 font-medium mt-1">Beklenen alım siparişi malzemeleri.</p>
                </div>
            </div>

            <ReceivingClient initialOrders={orders} />
        </div>
    );
}
