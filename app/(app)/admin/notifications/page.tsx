import React, { Suspense } from 'react';
import NotificationFetcher from './notification-fetcher';

export default async function NotificationsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        Bildirimler
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">İşletmenizin sağlığını korumak için kritik uyarıları takip edin.</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-50 h-32 animate-pulse" />
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-50 h-24 animate-pulse" />
                        ))}
                    </div>
                </div>
            }>
                <NotificationFetcher />
            </Suspense>
        </div>
    );
}
