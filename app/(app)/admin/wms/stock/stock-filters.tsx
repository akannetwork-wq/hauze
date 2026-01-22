'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
    warehouses: any[];
    locations: any[];
    currentPool?: string;
    currentLoc?: string;
}

export default function StockFilters({ warehouses, locations, currentPool, currentLoc }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function updateParams(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        if (key === 'pool') params.delete('loc'); // Reset location if pool changes
        router.push(`?${params.toString()}`);
    }

    return (
        <div className="flex flex-wrap gap-4 mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-top-4 duration-500">
            <div className="flex-1 min-w-[200px] space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Depo Seçin</label>
                <select
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={currentPool || ''}
                    onChange={(e) => updateParams('pool', e.target.value)}
                >
                    <option value="">Tüm Depolar</option>
                    {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.key}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 min-w-[200px] space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Lokasyon Seçin</label>
                <select
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={currentLoc || ''}
                    onChange={(e) => updateParams('loc', e.target.value)}
                >
                    <option value="">Tüm Lokasyonlar</option>
                    {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
