'use client';

import { useState } from 'react';
import { saveWarehouse, saveLocation } from '@/app/actions/wms';
import { useRouter } from 'next/navigation';

interface Props {
    initialWarehouses: any[];
    initialLocations: any[];
}

export default function WarehouseClient({ initialWarehouses, initialLocations }: Props) {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState(initialWarehouses);
    const [locations, setLocations] = useState(initialLocations);
    const [activePool, setActivePool] = useState<string | null>(initialWarehouses[0]?.id || null);

    const [isAddingPool, setIsAddingPool] = useState(false);
    const [isAddingLocation, setIsAddingLocation] = useState(false);

    const [newPool, setNewPool] = useState({ key: '', strategy: 'stock' });
    const [newLoc, setNewLoc] = useState({ name: '', type: 'storage' });

    async function handleAddPool() {
        if (!newPool.key) return;
        const res = await saveWarehouse(newPool);
        if (res.success) {
            setWarehouses([...warehouses, res.data]);
            setIsAddingPool(false);
            setNewPool({ key: '', strategy: 'stock' });
            router.refresh();
        }
    }

    async function handleAddLocation() {
        if (!newLoc.name || !activePool) return;
        const res = await saveLocation({ ...newLoc, pool_id: activePool });
        if (res.success) {
            setLocations([...locations, res.data]);
            setIsAddingLocation(false);
            setNewLoc({ name: '', type: 'storage' });
            router.refresh();
        }
    }

    const currentLocations = locations.filter(l => l.pool_id === activePool);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Warehouses */}
            <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">DEPOLAR</h3>
                    <button
                        onClick={() => setIsAddingPool(true)}
                        className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-2">
                    {warehouses.map(w => (
                        <button
                            key={w.id}
                            onClick={() => setActivePool(w.id)}
                            className={`w-full text-left px-4 py-3 rounded-2xl transition-all ${activePool === w.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' : 'bg-white border border-gray-100 text-gray-600 hover:border-indigo-200'}`}
                        >
                            {w.key}
                        </button>
                    ))}

                    {isAddingPool && (
                        <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-indigo-200 space-y-3">
                            <input
                                autoFocus
                                className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                placeholder="Depo Adı (örn: Merkez)"
                                value={newPool.key}
                                onChange={e => setNewPool({ ...newPool, key: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <button onClick={handleAddPool} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold">Ekle</button>
                                <button onClick={() => setIsAddingPool(false)} className="px-3 py-2 text-gray-400 text-xs">Vazgeç</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main: Locations */}
            <div className="lg:col-span-3">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[500px]">
                    {!activePool ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p>Lütfen işlem yapmak için bir depo seçin.</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">{warehouses.find(w => w.id === activePool)?.key} Lokasyonları</h2>
                                    <p className="text-sm text-gray-500">Bu depodaki tüm raf, göz ve bölümler.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddingLocation(true)}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Yeni Lokasyon
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {currentLocations.map(loc => (
                                    <div key={loc.id} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-lg font-bold text-gray-900">{loc.name}</div>
                                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                                                    {loc.type === 'storage' ? 'DEPOLAMA' : loc.type === 'picking' ? 'TOPLAMA' : loc.type === 'shipping' ? 'SEVKİYAT' : 'KABUL'}
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isAddingLocation && (
                                    <div className="p-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-white space-y-4">
                                        <input
                                            autoFocus
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Lokasyon Adı (örn: Raf A-1)"
                                            value={newLoc.name}
                                            onChange={e => setNewLoc({ ...newLoc, name: e.target.value })}
                                        />
                                        <select
                                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                                            value={newLoc.type}
                                            onChange={e => setNewLoc({ ...newLoc, type: e.target.value })}
                                        >
                                            <option value="storage">Depolama</option>
                                            <option value="picking">Toplama</option>
                                            <option value="shipping">Sevkiyat</option>
                                            <option value="receiving">Kabul</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button onClick={handleAddLocation} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold">Kaydet</button>
                                            <button onClick={() => setIsAddingLocation(false)} className="px-3 py-2 text-gray-400 text-xs">Vazgeç</button>
                                        </div>
                                    </div>
                                )}

                                {currentLocations.length === 0 && !isAddingLocation && (
                                    <div className="col-span-full py-12 text-center text-gray-400 italic text-sm">
                                        Henüz bu depo için bir lokasyon tanımlanmamış.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
