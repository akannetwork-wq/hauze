import CheckListClient from './check-list-client';

export default async function ChecksPage() {
    return (
        <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-700">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight text-indigo-600">Çek Portföyü</h1>
                    <p className="text-gray-500 mt-2 font-medium">Alınan/Verilen çeklerin takibi ve operasyon merkezi.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        // This will trigger the standard Sale/Purchase flow but with "Check" pre-selected (already handled in bridge.ts if we want)
                        // For now we just use the global satıs
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        📘 Rapor Al
                    </button>
                </div>
            </div>

            <CheckListClient />
        </div>
    );
}
