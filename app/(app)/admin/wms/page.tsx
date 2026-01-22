import { Suspense } from 'react';
import WmsDashboardContent from './wms-dashboard-content';

export default async function WmsDashboard() {
    return (
        <div className="p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Depo Yönetim Sistemi</h1>
                <p className="text-gray-500 mt-2">Depolarınızı, raflarınızı ve stok hareketlerinizi buradan yönetin.</p>
            </div>

            <Suspense fallback={
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-50 h-32 animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="h-64 bg-white rounded-3xl border border-gray-50 animate-pulse" />
                        <div className="h-64 bg-white rounded-3xl border border-gray-50 animate-pulse" />
                    </div>
                </div>
            }>
                <WmsDashboardContent />
            </Suspense>
        </div>
    );
}
