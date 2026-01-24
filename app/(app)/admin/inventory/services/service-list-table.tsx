'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Props {
    initialServices: any[];
    params: any;
}

export default function ServiceListTable({ initialServices, params }: Props) {
    const [services, setServices] = useState(initialServices);
    const [hasMore, setHasMore] = useState(initialServices.length === 50);
    const [page, setPage] = useState(1);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    async function handleLoadMore() {
        if (isMoreLoading) return;
        setIsMoreLoading(true);
        const nextOffset = page * 50;
        try {
            const { getProducts } = await import('@/app/actions/inventory');
            const nextBatch = await getProducts({
                ...params,
                type: 'service',
                limit: 50,
                offset: nextOffset
            });

            if (nextBatch.length > 0) {
                setServices(prev => [...prev, ...nextBatch]);
                setPage(prev => prev + 1);
                setHasMore(nextBatch.length === 50);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more services:', error);
        } finally {
            setIsMoreLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Hizmet Bilgisi</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Kategori</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest text-right">Başlangıç Fiyatı</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Durum</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {services.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic font-medium">
                                Kayıtlı hizmet bulunamadı.
                            </td>
                        </tr>
                    ) : (
                        services.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50/50 transition-all group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                            🛠️
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{service.title}</div>
                                            <div className="text-[10px] text-gray-400 font-mono mt-1 font-black bg-gray-100 px-2 py-0.5 rounded-md inline-block">{service.sku}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[11px] font-black text-gray-500 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-wider border border-gray-100">
                                        {service.category?.name || 'GENEL'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="text-lg font-black text-gray-900 font-mono">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(service.prices?.[0]?.amount || 0)}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">+ Akıllı Fiyatlandırma</div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${service.is_active ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-gray-300'}`} />
                                        <span className={`text-[11px] font-black uppercase tracking-wide ${service.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                                            {service.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <Link
                                        href={`/admin/inventory/services/${service.id}`}
                                        className="inline-flex items-center justify-center px-6 py-2.5 bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-emerald-100"
                                    >
                                        Yapılandır
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {hasMore && (
                <div className="p-8 border-t border-gray-50 flex justify-center bg-gray-50/30">
                    <button
                        onClick={handleLoadMore}
                        disabled={isMoreLoading}
                        className="bg-white border border-gray-200 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                    >
                        {isMoreLoading ? 'Yükleniyor...' : 'Daha Fazla Hizmet Yükle'}
                    </button>
                </div>
            )}
        </div>
    );
}
