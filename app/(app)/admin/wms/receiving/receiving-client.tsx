'use client';

import { useState } from 'react';
import { processWmsAction } from '@/app/actions/wms';
import { useRouter } from 'next/navigation';
import OrderDialog from '../../orders/components/order-dialog';

interface Props {
    initialOrders: any[];
}

export default function ReceivingClient({ initialOrders }: Props) {
    const router = useRouter();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    async function handleReceive(id: string) {
        if (!confirm('Tüm ürünlerin eksiksiz ve sağlam olduğunu onaylıyor musunuz? Bu işlem stokları artıracaktır.')) return;

        setLoading(id);
        const res = await processWmsAction(id, 'receive');
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
                        <th className="px-8 py-5">Tedarikçi</th>
                        <th className="px-8 py-5">Depo</th>
                        <th className="px-8 py-5">Bekleme</th>
                        <th className="px-8 py-5 text-right">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {initialOrders.map(o => (
                        <tr key={o.id} className="text-sm hover:bg-gray-50 transition-colors group">
                            <td className="px-8 py-5">
                                <button
                                    onClick={() => setSelectedOrderId(o.id)}
                                    className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors"
                                >
                                    #{o.id.slice(0, 8).toUpperCase()}
                                </button>
                                <div className="text-[10px] text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('tr-TR')}</div>
                            </td>
                            <td className="px-8 py-5 text-gray-600 font-medium">
                                {o.contacts?.company_name || `${o.contacts?.first_name} ${o.contacts?.last_name}`}
                            </td>
                            <td className="px-8 py-5">
                                <span className="px-2 py-1 bg-amber-50 rounded-lg text-[10px] font-bold text-amber-600 border border-amber-100 uppercase">
                                    {o.warehouse?.key || 'N/A'}
                                </span>
                            </td>
                            <td className="px-8 py-5">
                                {Math.floor((new Date().getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24))} Gün
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setSelectedOrderId(o.id)}
                                        className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                                    >
                                        İçeriği Gör
                                    </button>
                                    <button
                                        disabled={loading === o.id}
                                        onClick={() => handleReceive(o.id)}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                        📥 Teslim Al (Stok Girişi)
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {initialOrders.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                                Beklenen alım siparişi bulunamadı.
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
