import Link from 'next/link';
import { getWmsSummary } from '@/app/actions/wms';

export default async function WmsDashboardContent() {
    const summary = await getWmsSummary();

    return (
        <div className="animate-in fade-in duration-700">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <Link href="/admin/wms/picking" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all group">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600">Hazırlanacaklar</div>
                    <div className="text-3xl font-black text-indigo-600">{summary.stats.pendingPicking}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Bekleyen Satışlar</div>
                </Link>
                <Link href="/admin/wms/receiving" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all group">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-emerald-600">Teslim Alınacaklar</div>
                    <div className="text-3xl font-black text-emerald-600">{summary.stats.pendingReceiving}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Bekleyen Alımlar</div>
                </Link>
                <Link href="/admin/wms/stock" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 transition-all group">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-rose-600">Düşük Stok Uyarıları</div>
                    <div className="text-3xl font-black text-rose-600">{summary.stats.lowStockCount}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Kritik Seviye Altı</div>
                </Link>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Depo Sayısı</div>
                    <div className="text-3xl font-black text-gray-900">{summary.stats.warehouses}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Dosyalanmış Havuzlar</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Operations Links */}
                <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <span>🚀</span> Hızlı İşlemler
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <Link href="/admin/wms/picking" className="group bg-indigo-600 p-6 rounded-3xl border border-indigo-500 shadow-lg shadow-indigo-100 hover:shadow-indigo-500/20 transition-all duration-300">
                            <h4 className="font-bold text-white flex items-center justify-between">
                                Ürün Toplama (Picking)
                                <span className="text-indigo-200">→</span>
                            </h4>
                            <p className="text-xs text-indigo-100 mt-1">Satış siparişlerini hazırla ve paketle.</p>
                        </Link>

                        <Link href="/admin/wms/receiving" className="group bg-emerald-600 p-6 rounded-3xl border border-emerald-500 shadow-lg shadow-emerald-100 hover:shadow-emerald-500/20 transition-all duration-300">
                            <h4 className="font-bold text-white flex items-center justify-between">
                                Mal Kabul (Receiving)
                                <span className="text-emerald-200">→</span>
                            </h4>
                            <p className="text-xs text-emerald-100 mt-1">Alım siparişlerini kontrol et ve stokla.</p>
                        </Link>

                        <Link href="/admin/wms/counting" className="group bg-gray-900 p-6 rounded-3xl border border-gray-800 shadow-lg shadow-gray-100 hover:shadow-gray-900/20 transition-all duration-300">
                            <h4 className="font-bold text-white flex items-center justify-between">
                                Stok Sayımı (Audit)
                                <span className="text-gray-400">→</span>
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">Fiziksel stok ile sistem verilerini eşitle.</p>
                        </Link>

                        <div className="pt-4 grid grid-cols-2 gap-3">
                            <Link href="/admin/wms/movements" className="bg-white p-4 rounded-2xl border border-gray-100 text-center hover:bg-gray-50 transition-colors">
                                <span className="block text-xs font-bold text-gray-900">Hareketler</span>
                            </Link>
                            <Link href="/admin/wms/stock" className="bg-white p-4 rounded-2xl border border-gray-100 text-center hover:bg-gray-50 transition-colors">
                                <span className="block text-xs font-bold text-gray-900">Anlık Stok</span>
                            </Link>
                            <Link href="/admin/wms/warehouses" className="bg-white p-4 rounded-2xl border border-gray-100 text-center hover:bg-gray-50 transition-colors">
                                <span className="block text-xs font-bold text-gray-900">Depolar</span>
                            </Link>
                            <Link href="/admin/wms/shipments" className="bg-white p-4 rounded-2xl border border-gray-100 text-center hover:bg-gray-50 transition-colors">
                                <span className="block text-xs font-bold text-gray-900">Sevkiyatlar</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Queues */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Picking Queue */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Toplama Kuyruğu
                            </h3>
                            <Link href="/admin/wms/picking" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Tümünü Gör →</Link>
                        </div>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-gray-50">
                                    {summary.ordersToPrepare?.map((o: any) => (
                                        <tr key={o.id} className="text-xs hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase">#{o.id.slice(0, 8)}</div>
                                                <div className="text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('tr-TR')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-600 font-medium">{o.contacts?.company_name || `${o.contacts?.first_name} ${o.contacts?.last_name}`}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase ${o.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {o.status === 'pending' ? 'BEKLEYEN' : 'HAZIRLANIYOR'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {summary.ordersToPrepare?.length === 0 && (
                                        <tr><td className="px-6 py-8 text-center text-gray-400 italic">Hazırlanacak sipariş bulunmuyor.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Receiving Queue */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Beklenen Alımlar
                            </h3>
                            <Link href="/admin/wms/receiving" className="text-xs font-bold text-emerald-600 hover:text-emerald-800">Tümünü Gör →</Link>
                        </div>
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-gray-50">
                                    {summary.ordersToReceive?.map((o: any) => (
                                        <tr key={o.id} className="text-xs hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors uppercase">#{o.id.slice(0, 8)}</div>
                                                <div className="text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('tr-TR')}</div>
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="text-gray-600 font-medium">{o.contacts?.company_name || `${o.contacts?.first_name} ${o.contacts?.last_name}`}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2 py-1 bg-amber-50 rounded-lg font-black text-[10px] text-amber-600 uppercase">
                                                    BEKLENİYOR
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {summary.ordersToReceive?.length === 0 && (
                                        <tr><td className="px-6 py-8 text-center text-gray-400 italic">Beklenen alım bulunmuyor.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
