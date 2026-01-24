'use client';

import { useState, useMemo } from 'react';
import { saveStockAudit } from '@/app/actions/wms';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Props {
    initialStock: any[];
    warehouses: any[];
}

export default function CountingClient({ initialStock, warehouses }: Props) {
    const router = useRouter();
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [reasons, setReasons] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStock = useMemo(() => {
        return initialStock.filter(s => {
            const matchesWarehouse = !warehouseFilter || s.warehouse_locations?.pool_id === warehouseFilter;
            const matchesSearch = !searchQuery ||
                s.products?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.products?.sku.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesWarehouse && matchesSearch;
        });
    }, [initialStock, warehouseFilter, searchQuery]);

    const handleCountChange = (productId: string, locationId: string, val: number) => {
        setCounts(prev => ({ ...prev, [`${productId}-${locationId}`]: val }));
    };

    const handleReasonChange = (productId: string, locationId: string, val: string) => {
        setReasons(prev => ({ ...prev, [`${productId}-${locationId}`]: val }));
    };

    async function handleSave() {
        const auditData = Object.entries(counts).map(([key, actual]) => {
            const [product_id, location_id] = key.split('-');
            return {
                product_id,
                location_id,
                actual_quantity: actual,
                reason: reasons[key]
            };
        });

        if (auditData.length === 0) {
            toast.error('Henüz bir sayım girişi yapmadınız.');
            return;
        }

        if (!confirm(`${auditData.length} ürün için sayım sonuçlarını kaydetmek istiyor musunuz? Farklılıklar stok hareketlerine yansıtılacaktır.`)) return;

        setLoading(true);
        const res = await saveStockAudit(auditData);
        setLoading(false);

        if (res.success) {
            toast.success('Sayım başarıyla kaydedildi.');
            setCounts({});
            setReasons({});
            router.refresh();
        } else {
            toast.error('Hata: ' + res.error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Depo Filtresi</label>
                    <select
                        value={warehouseFilter}
                        onChange={(e) => setWarehouseFilter(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        <option value="">Tüm Depolar</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.key}</option>)}
                    </select>
                </div>
                <div className="flex-[2] space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ürün / SKU Ara</label>
                    <input
                        type="text"
                        placeholder="Ürün adı veya SKU ile hızlıca bul..."
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                        <tr>
                            <th className="px-8 py-5">Ürün</th>
                            <th className="px-8 py-5">Lokasyon</th>
                            <th className="px-8 py-5 text-center">Sistem</th>
                            <th className="px-8 py-5 text-center">Fiziksel (Sayım)</th>
                            <th className="px-8 py-5">Açıklama / Neden</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredStock.map(s => {
                            const key = `${s.product_id}-${s.location_id}`;
                            const isChanged = counts[key] !== undefined && counts[key] !== s.quantity_on_hand;

                            return (
                                <tr key={key} className={`text-sm hover:bg-gray-50 transition-colors ${isChanged ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-gray-900">{s.products?.title}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{s.products?.sku}</div>
                                    </td>
                                    <td className="px-8 py-5 text-gray-600 font-medium">
                                        {s.warehouse_locations?.name}
                                    </td>
                                    <td className="px-8 py-5 text-center font-bold text-gray-400">
                                        {s.quantity_on_hand}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <input
                                            type="number"
                                            className="w-20 bg-gray-50 border-none rounded-xl px-2 py-2 text-center text-sm font-black focus:ring-2 focus:ring-indigo-500"
                                            value={counts[key] === undefined ? s.quantity_on_hand : counts[key]}
                                            onChange={(e) => handleCountChange(s.product_id, s.location_id, Number(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-8 py-5">
                                        <input
                                            type="text"
                                            placeholder="Örn: Hasarlı, Kayıp..."
                                            className={`w-full bg-gray-50/50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 ${isChanged ? 'bg-white border-indigo-100' : ''}`}
                                            value={reasons[key] || ''}
                                            onChange={(e) => handleReasonChange(s.product_id, s.location_id, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end pt-4 pb-12">
                <button
                    disabled={loading || Object.keys(counts).length === 0}
                    onClick={handleSave}
                    className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? 'Kaydediliyor...' : '📥 Sayım Sonuçlarını Onayla ve Kaydet'}
                </button>
            </div>
        </div>
    );
}
