import Link from 'next/link';
import { getProducts, getCategories } from '@/app/actions/inventory';
import { getInventory } from '@/app/actions/commerce';
import ProductFilterBar from '../products/filter-bar';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConsumableListPage({ searchParams }: Props) {
    const params = await searchParams;

    const [products, categories, inventory] = await Promise.all([
        getProducts({
            type: 'consumable',
            search: params.q as string,
            categoryId: params.category as string,
            status: params.status as string,
            sortBy: params.sort as string,
            sortOrder: params.order as 'asc' | 'desc'
        }),
        getCategories('consumable'),
        getInventory()
    ]);

    // Create a map for quick stock lookup
    const stockMap = Object.fromEntries(
        inventory.map((item: any) => [item.sku, (item.state as any)?.on_hand || 0])
    );

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 text-amber-600 flex items-center gap-2">
                        <span>🏗️</span>
                        Sarf Malzemeler
                    </h1>
                    <p className="text-gray-500">Üretimde kullandığınız hammadde, yardımcı malzeme ve materyalleri yönetin.</p>
                </div>
                <Link
                    href="/admin/inventory/consumables/new"
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                    + Yeni Malzeme
                </Link>
            </div>

            <ProductFilterBar categories={categories} />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold w-16">Resim</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Malzeme / SKU</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Birim</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Durum</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Stok</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {(params.q || params.category || params.status)
                                        ? 'Aramanızla eşleşen malzeme bulunamadı.'
                                        : 'Henüz sarf malzemesi eklenmemiş.'}
                                </td>
                            </tr>
                        ) : (
                            products.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                            {item.cover_thumb || item.cover_image ? (
                                                <img src={item.cover_thumb || item.cover_image!} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg opacity-40">🏗️</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{item.title}</div>
                                        <div className="text-[10px] text-gray-400 font-mono tracking-wider">{item.sku}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase">
                                            {item.unit || 'adet'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            <span className="text-xs text-gray-600">{item.is_active ? 'Aktif' : 'Pasif'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${stockMap[item.sku] < 10 ? 'text-rose-600' : 'text-gray-900'}`}>
                                                {stockMap[item.sku] ?? 0}
                                            </span>
                                            <span className="text-[10px] text-gray-400 uppercase font-medium">{item.unit || 'adet'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/inventory/consumables/${item.id}`}
                                            className="text-amber-600 hover:text-amber-800 text-sm font-bold hover:underline transition-all"
                                        >
                                            Düzenle
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
