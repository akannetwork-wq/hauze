'use client';

import { useState } from 'react';
import { processWmsAction } from '@/app/actions/wms';
import { useRouter } from 'next/navigation';
import OrderDialog from '../../orders/components/order-dialog';

interface Props {
    initialOrders: any[];
}

export default function PickingClient({ initialOrders }: Props) {
    const router = useRouter();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    async function handleAction(id: string, action: 'pick' | 'ship') {
        setLoading(id);
        const res = await processWmsAction(id, action);
        setLoading(null);
        if (res.success) {
            router.refresh();
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                    <tr>
                        <th className="px-8 py-5">Sipariş</th>
                        <th className="px-8 py-5">Müşteri</th>
                        <th className="px-8 py-5">Depo</th>
                        <th className="px-8 py-5">Durum</th>
                        <th className="px-8 py-5 text-right">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {initialOrders.map(o => (
                        <tr key={o.id} className="text-sm hover:bg-gray-50 transition-colors group">
                            <td className="px-8 py-5">
                                <button
                                    onClick={() => setSelectedOrderId(o.id)}
                                    className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors"
                                >
                                    #{o.id.slice(0, 8).toUpperCase()}
                                </button>
                                <div className="text-[10px] text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('tr-TR')}</div>
                            </td>
                            <td className="px-8 py-5 text-gray-600">
                                {o.contacts?.company_name || `${o.contacts?.first_name} ${o.contacts?.last_name}`}
                            </td>
                            <td className="px-8 py-5">
                                <span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-200 uppercase">
                                    {o.warehouse?.key || 'N/A'}
                                </span>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${o.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                        o.status === 'preparing' ? 'bg-indigo-50 text-indigo-600' :
                                            'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {o.status === 'pending' ? 'Bekliyor' :
                                        o.status === 'preparing' ? 'Hazırlanıyor' :
                                            'Hazır'}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                    {o.status === 'pending' && (
                                        <button
                                            disabled={loading === o.id}
                                            onClick={() => handleAction(o.id, 'pick')}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:scale-105 transition-all disabled:opacity-50"
                                        >
                                            Hazırlamaya Başla
                                        </button>
                                    )}
                                    {o.status === 'preparing' && (
                                        <button
                                            onClick={() => setSelectedOrderId(o.id)}
                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                                        >
                                            Paketi Tamamla
                                        </button>
                                    )}
                                    {o.status === 'ready' && (
                                        <button
                                            disabled={loading === o.id}
                                            onClick={() => handleAction(o.id, 'ship')}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-100 hover:scale-105 transition-all disabled:opacity-50"
                                        >
                                            Kargoya Ver
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {initialOrders.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                                Hazırlanacak sipariş bulunamadı.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {selectedOrderId && (
                <OrderDialog
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    onSuccess={() => {
                        setSelectedOrderId(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
