import { Suspense } from 'react';
import { getWarehouses, getLocations } from '@/app/actions/wms';
import Link from 'next/link';
import StockFilters from './stock-filters';
import StockFetcher from './stock-fetcher';

export default async function StockPage({ searchParams }: { searchParams: Promise<{ pool?: string, loc?: string }> }) {
    const sParams = await searchParams;
    const warehouses = await getWarehouses();
    const locations = await getLocations(sParams.pool);

    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/wms" className="hover:text-indigo-600 transition-colors">WMS</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Stok Durumu</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Raf Bazlı Stok Durumu</h1>
                </div>
            </div>

            <StockFilters
                warehouses={warehouses}
                locations={locations}
                currentPool={sParams.pool}
                currentLoc={sParams.loc}
            />

            <Suspense key={JSON.stringify(sParams)} fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-32 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                    <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Stok Verileri Çekiliyor...</p>
                </div>
            }>
                <StockFetcher
                    warehouseId={sParams.pool}
                    locationId={sParams.loc}
                    warehouses={warehouses}
                />
            </Suspense>
        </div>
    );
}
