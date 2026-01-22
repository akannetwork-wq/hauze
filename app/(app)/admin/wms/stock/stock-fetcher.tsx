import { getWmsStock } from '@/app/actions/wms';

interface Props {
    warehouseId?: string;
    locationId?: string;
    warehouses: any[];
}

export default async function StockFetcher({ warehouseId, locationId, warehouses }: Props) {
    const stock = await getWmsStock({
        warehouseId,
        locationId
    });

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Ürün</th>
                        <th className="px-8 py-5">SKU</th>
                        <th className="px-8 py-5">Depo</th>
                        <th className="px-8 py-5">Lokasyon</th>
                        <th className="px-8 py-5 text-right">Eldeki Stok</th>
                        <th className="px-8 py-5 text-right">Rezerve</th>
                        <th className="px-8 py-5 text-right">Net Stok</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {stock.map((s: any) => (
                        <tr key={s.id} className="text-sm hover:bg-gray-50 transition-colors group">
                            <td className="px-8 py-5 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{s.products?.title}</td>
                            <td className="px-8 py-5 text-gray-400 font-mono text-xs">{s.products?.sku}</td>
                            <td className="px-8 py-5 text-gray-600 font-medium">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                                    {warehouses.find(w => w.id === s.warehouse_locations?.pool_id)?.key || 'N/A'}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-gray-500 font-medium">
                                <span className="px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">{s.warehouse_locations?.name}</span>
                            </td>
                            <td className="px-8 py-5 text-right font-black text-gray-900 text-base">{s.quantity_on_hand}</td>
                            <td className="px-8 py-5 text-right font-bold text-rose-500">-{s.quantity_reserved}</td>
                            <td className="px-8 py-5 text-right font-black text-indigo-600 text-lg">
                                {(s.quantity_on_hand - s.quantity_reserved).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                    {stock.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-8 py-20 text-center text-gray-400 italic font-medium">
                                Seçili kriterlere uygun stok kaydı bulunamadı.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
