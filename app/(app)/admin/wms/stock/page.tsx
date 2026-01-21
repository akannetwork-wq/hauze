import { getWmsStock, getWarehouses, getLocations } from '@/app/actions/wms';
import Link from 'next/link';

export default async function StockPage({ searchParams }: { searchParams: Promise<{ pool?: string, loc?: string }> }) {
    const sParams = await searchParams;
    const stock = await getWmsStock({
        warehouseId: sParams.pool,
        locationId: sParams.loc
    });
    const warehouses = await getWarehouses();
    const locations = await getLocations(sParams.pool);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/wms" className="hover:text-indigo-600 transition-colors">WMS</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Stok Durumu</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Raf Bazlı Stok Durumu</h1>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Depo Seçin</label>
                    <select
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        value={sParams.pool || ''}
                        onChange={(e) => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('pool', e.target.value);
                            url.searchParams.delete('loc');
                            window.location.href = url.toString();
                        }}
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
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        value={sParams.loc || ''}
                        onChange={(e) => {
                            const url = new URL(window.location.href);
                            url.searchParams.set('loc', e.target.value);
                            window.location.href = url.toString();
                        }}
                    >
                        <option value="">Tüm Lokasyonlar</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stock List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Ürün</th>
                            <th className="px-8 py-4">SKU</th>
                            <th className="px-8 py-4">Depo</th>
                            <th className="px-8 py-4">Lokasyon</th>
                            <th className="px-8 py-4 text-right">Eldeki Stok</th>
                            <th className="px-8 py-4 text-right">Rezerve</th>
                            <th className="px-8 py-4 text-right">Net Stok</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {stock.map((s: any) => (
                            <tr key={s.id} className="text-sm hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-4 font-bold text-gray-900">{s.products?.title}</td>
                                <td className="px-8 py-4 text-gray-500">{s.products?.sku}</td>
                                <td className="px-8 py-4 text-gray-600 font-medium">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase">
                                        {warehouses.find(w => w.id === s.warehouse_locations?.pool_id)?.key || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-gray-600 font-medium">{s.warehouse_locations?.name}</td>
                                <td className="px-8 py-4 text-right font-black text-gray-900">{s.quantity_on_hand}</td>
                                <td className="px-8 py-4 text-right font-medium text-amber-600">-{s.quantity_reserved}</td>
                                <td className="px-8 py-4 text-right font-black text-indigo-600">
                                    {(s.quantity_on_hand - s.quantity_reserved).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {stock.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-8 py-12 text-center text-gray-400 italic">
                                    Seçili kriterlere uygun stok kaydı bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
