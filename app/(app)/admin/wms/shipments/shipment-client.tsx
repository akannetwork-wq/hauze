'use client';

import { useState } from 'react';
import { updateShipmentStatus } from '@/app/actions/wms';
import { useRouter } from 'next/navigation';

interface Props {
    initialShipments: any[];
}

export default function ShipmentClient({ initialShipments }: Props) {
    const router = useRouter();
    const [shipments, setShipments] = useState(initialShipments);
    const [loading, setLoading] = useState<string | null>(null);

    async function handleUpdateStatus(id: string, status: string) {
        setLoading(id);
        const res = await updateShipmentStatus(id, status);
        setLoading(null);
        if (res.success) {
            router.refresh();
        }
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-8 py-4">Sipariş No</th>
                        <th className="px-8 py-4">Durum</th>
                        <th className="px-8 py-4">Kargo / Takip</th>
                        <th className="px-8 py-4 text-right">İşlemler</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {shipments.map(s => (
                        <tr key={s.id} className="text-sm hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-4 font-bold text-gray-900">
                                #{s.order_id?.slice(0, 8)}
                                <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                                    {s.orders?.total.toLocaleString('tr-TR')} {s.orders?.currency}
                                </div>
                            </td>
                            <td className="px-8 py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                        s.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                            s.status === 'picking' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                    }`}>
                                    {s.status}
                                </span>
                            </td>
                            <td className="px-8 py-4 text-gray-600">
                                {s.carrier || '-'}
                                {s.tracking_number && <div className="text-[10px] font-mono">{s.tracking_number}</div>}
                            </td>
                            <td className="px-8 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {s.status === 'pending' && (
                                        <button
                                            disabled={loading === s.id}
                                            onClick={() => handleUpdateStatus(s.id, 'picking')}
                                            className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100"
                                        >
                                            Toplanıyor
                                        </button>
                                    )}
                                    {s.status === 'picking' && (
                                        <button
                                            disabled={loading === s.id}
                                            onClick={() => handleUpdateStatus(s.id, 'shipped')}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
                                        >
                                            Kargoya Ver
                                        </button>
                                    )}
                                    {s.status === 'shipped' && (
                                        <button
                                            disabled={loading === s.id}
                                            onClick={() => handleUpdateStatus(s.id, 'delivered')}
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100"
                                        >
                                            Teslim Edildi
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {shipments.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">Hazırlanan sevkiyat bulunmuyor.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
