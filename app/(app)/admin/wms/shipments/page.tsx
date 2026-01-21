import { getShipments } from '@/app/actions/wms';
import ShipmentClient from './shipment-client';
import Link from 'next/link';

export default async function ShipmentsPage() {
    const shipments = await getShipments();

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Link href="/admin/wms" className="hover:text-rose-600 transition-colors">WMS</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Sevkiyat Yönetimi</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sevkiyat ve Paketleme</h1>
                <p className="text-gray-500 mt-2">Çıkış bekleyen siparişleri toplayın, paketleyin ve kargoya verin.</p>
            </div>

            <ShipmentClient initialShipments={shipments} />
        </div>
    );
}
