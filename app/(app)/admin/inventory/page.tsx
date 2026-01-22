import { Suspense } from 'react';
import InventoryContent from './inventory-content';

export default async function InventoryDashboard() {
    return (
        <div className="p-8 font-sans max-w-[1600px] mx-auto">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Envanter Dashboard</h1>
                <p className="text-gray-500 mt-2 text-lg">Tüm operasyonel kalemlerinizi tek ekrandan yönetin.</p>
            </div>

            <Suspense fallback={
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 h-[400px] animate-pulse" />
                    ))}
                </div>
            }>
                <InventoryContent />
            </Suspense>
        </div>
    );
}