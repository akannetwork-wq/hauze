import Link from 'next/link';
import { getWmsSummary } from '@/app/actions/wms';

export default async function WmsDashboardContent() {
    const summary = await getWmsSummary();

    return (
        <div className="animate-in fade-in duration-700">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aktif Depolar</div>
                    <div className="text-3xl font-black text-indigo-600">{summary.stats.warehouses}</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Son 30 Gün Hareket</div>
                    <div className="text-3xl font-black text-emerald-600">{summary.stats.movements}</div>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Düşük Stok Uyarıları</div>
                    <div className="text-3xl font-black text-rose-600">{summary.lowStock.length}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-gray-900">Hızlı İşlemler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/admin/wms/movements" className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-900">Stok Hareketleri</h4>
                            <p className="text-xs text-gray-500 mt-1">Giriş, çıkış ve transferler.</p>
                        </Link>

                        <Link href="/admin/wms/stock" className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-900">Raf Bazlı Stok</h4>
                            <p className="text-xs text-gray-500 mt-1">Konum bazlı anlık durum.</p>
                        </Link>

                        <Link href="/admin/wms/warehouses" className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-900">Depo Yapısı</h4>
                            <p className="text-xs text-gray-500 mt-1">Bina ve raf tanımları.</p>
                        </Link>

                        <Link href="/admin/wms/shipments" className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300">
                            <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-900">Sevkiyatlar</h4>
                            <p className="text-xs text-gray-500 mt-1">Çıkış bekleyen ürünler.</p>
                        </Link>
                    </div>
                </div>

                {/* Orders to Prepare */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-900">Hazırlanacak Siparişler</h3>
                        <Link href="/admin/orders" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Tümünü Gör →</Link>
                    </div>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Sipariş</th>
                                    <th className="px-6 py-3">Müşteri</th>
                                    <th className="px-6 py-3 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {summary.ordersToPrepare?.map((o: any) => (
                                    <tr key={o.id} className="text-xs hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/orders/${o.id}`} className="block">
                                                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">#{o.id.slice(0, 8).toUpperCase()}</div>
                                                <div className="text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('tr-TR')}</div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-600">{o.contacts?.company_name || `${o.contacts?.first_name} ${o.contacts?.last_name}`}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase ${o.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {o.status === 'pending' ? 'Bekliyor' : 'Hazırlanıyor'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {summary.ordersToPrepare?.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">Hazırlanacak sipariş bulunmuyor.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Items */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-gray-900">Son Hareketler</h3>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-50">
                                {summary.recentMovements.map((m: any) => (
                                    <tr key={m.id} className="text-xs hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{m.products?.title}</div>
                                            <div className="text-gray-400 mt-0.5">{new Date(m.created_at).toLocaleDateString('tr-TR')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-md font-black ${m.type === 'IN' ? 'bg-emerald-50 text-emerald-600' :
                                                m.type === 'OUT' ? 'bg-rose-50 text-rose-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                {m.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900">
                                            {m.quantity}
                                        </td>
                                    </tr>
                                ))}
                                {summary.recentMovements.length === 0 && (
                                    <tr>
                                        <td className="px-6 py-12 text-center text-gray-400 italic">Henüz hareket bulunmuyor.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
