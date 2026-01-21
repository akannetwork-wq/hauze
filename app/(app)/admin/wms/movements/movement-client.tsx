'use client';

import { useState } from 'react';
import { recordMovement } from '@/app/actions/wms';
import { useRouter } from 'next/navigation';

interface Props {
    warehouses: any[];
    locations: any[];
    products: any[];
    initialMovements: any[];
}

export default function MovementClient({ warehouses, locations, products, initialMovements }: Props) {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        product_id: '',
        type: 'IN' as 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT',
        quantity: 0,
        from_location_id: '',
        to_location_id: '',
        description: ''
    });

    async function handleSubmit() {
        if (!form.product_id || form.quantity <= 0) {
            alert('Lütfen ürün ve geçerli bir miktar seçin.');
            return;
        }

        setLoading(true);
        const res = await recordMovement(form);
        setLoading(false);

        if (res.success) {
            setIsAdding(false);
            setForm({
                product_id: '',
                type: 'IN',
                quantity: 0,
                from_location_id: '',
                to_location_id: '',
                description: ''
            });
            router.refresh();
        } else {
            alert('Hata: ' + res.error);
        }
    }

    return (
        <div className="space-y-8">
            {/* New Movement Trigger */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Hareket Kaydet
                </button>
            ) : (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900">Yeni Stok Hareketi</h2>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 text-sm">Vazgeç</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İşlem Tipi</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setForm({ ...form, type: t as any })}
                                        className={`py-2 rounded-xl text-[10px] font-black transition-all ${form.type === t ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {t === 'IN' ? 'GİRİŞ' : t === 'OUT' ? 'ÇIKIŞ' : t === 'TRANSFER' ? 'TRANSFER' : 'DÜZELTME'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Ürün</label>
                            <select
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                value={form.product_id}
                                onChange={e => setForm({ ...form, product_id: e.target.value })}
                            >
                                <option value="">Ürün Seçin...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
                                ))}
                            </select>
                        </div>

                        {/* Locations */}
                        {(form.type === 'OUT' || form.type === 'TRANSFER' || form.type === 'ADJUSTMENT') && (
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Kaynak Lokasyon</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={form.from_location_id}
                                    onChange={e => setForm({ ...form, from_location_id: e.target.value })}
                                >
                                    <option value="">Lokasyon Seçin...</option>
                                    {locations.map(l => (
                                        <option key={l.id} value={l.id}>[{l.inventory_pools?.key}] {l.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {(form.type === 'IN' || form.type === 'TRANSFER' || form.type === 'ADJUSTMENT') && (
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Hedef Lokasyon</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                    value={form.to_location_id}
                                    onChange={e => setForm({ ...form, to_location_id: e.target.value })}
                                >
                                    <option value="">Lokasyon Seçin...</option>
                                    {locations.map(l => (
                                        <option key={l.id} value={l.id}>[{l.inventory_pools?.key}] {l.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Miktar</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                value={form.quantity}
                                onChange={e => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Açıklama / Referans</label>
                        <textarea
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                            placeholder="İşlem nedeni, irsaliye no vb."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            disabled={loading}
                            onClick={handleSubmit}
                            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                        >
                            {loading ? 'Kaydediliyor...' : 'Hareketi Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Son Hareketler</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Tarih</th>
                            <th className="px-8 py-4">Tip</th>
                            <th className="px-8 py-4">Ürün</th>
                            <th className="px-8 py-4">Kaynak</th>
                            <th className="px-8 py-4">Hedef</th>
                            <th className="px-8 py-4 text-right">Miktar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {initialMovements.map(m => (
                            <tr key={m.id} className="text-sm hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-4 text-gray-500 text-xs">
                                    {new Date(m.created_at).toLocaleString('tr-TR')}
                                </td>
                                <td className="px-8 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${m.type === 'IN' ? 'bg-emerald-100 text-emerald-700' :
                                            m.type === 'OUT' ? 'bg-rose-100 text-rose-700' :
                                                m.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                        }`}>
                                        {m.type}
                                    </span>
                                </td>
                                <td className="px-8 py-4 font-bold text-gray-900">
                                    {m.products?.title}
                                    <div className="text-[10px] text-gray-400 font-normal">{m.products?.sku}</div>
                                </td>
                                <td className="px-8 py-4 text-gray-600 text-xs font-medium">{m.from?.name || '-'}</td>
                                <td className="px-8 py-4 text-gray-600 text-xs font-medium">{m.to?.name || '-'}</td>
                                <td className="px-8 py-4 text-right font-black text-gray-900">{m.quantity}</td>
                            </tr>
                        ))}
                        {initialMovements.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-8 py-12 text-center text-gray-400 italic">Henüz hareket kaydı bulunmamaktadır.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
