import React, { Suspense } from 'react';
import OrderFetcher from './order-fetcher';
import Link from 'next/link';

export default async function OrdersPage() {
    return (
        <div className="p-4 w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Siparişler</h1>
                    <p className="text-gray-500 mt-1">İşletmenizin tüm satış ve sipariş süreçlerini yönetin.</p>
                </div>
                <div className="flex gap-4">
                    <Link
                        href="?drawer=global-order"
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        + Satış
                    </Link>
                    <Link
                        href="/admin/orders/new/service"
                        className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                        + Hizmet
                    </Link>
                </div>
            </div>

            <Suspense fallback={
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-100 p-6 rounded-[2rem] h-24 animate-pulse" />
                        ))}
                    </div>
                    <div className="h-96 bg-gray-100 rounded-[3rem] animate-pulse" />
                </div>
            }>
                <OrderFetcher />
            </Suspense>
        </div>
    );
}
