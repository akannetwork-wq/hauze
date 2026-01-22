import React, { Suspense } from 'react';
import OrderFetcher from './order-fetcher';

export default async function OrdersPage() {
    return (
        <div className="p-4 w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Siparişler</h1>
                    <p className="text-gray-500 mt-1">İşletmenizin tüm satış ve sipariş süreçlerini yönetin.</p>
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
