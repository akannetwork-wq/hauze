import { Suspense } from 'react';
import AccountingContent from './accounting-content';

export default async function AccountingDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Muhasebe ve Finans</h1>
                <p className="text-gray-500 mt-2 leading-relaxed">Müşterilerinizi, tedarikçilerinizi ve tüm finansal hareketlerinizi buradan yönetin.</p>
            </div>

            <Suspense fallback={
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-50 h-24 animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-12 rounded-3xl border border-gray-50 h-48 animate-pulse" />
                        ))}
                    </div>
                    <div className="h-96 bg-white rounded-3xl border border-gray-50 animate-pulse" />
                </div>
            }>
                <AccountingContent />
            </Suspense>
        </div>
    );
}
