import Link from 'next/link';
import { getProducts, getCategories } from '@/app/actions/inventory';
import ProductFilterBar from './filter-bar';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductListPage({ searchParams }: Props) {
    const params = await searchParams;

    // Extract filters from URL
    const products = await getProducts({
        type: 'product',
        search: params.q as string,
        categoryId: params.category as string,
        status: params.status as string,
        sortBy: params.sort as string,
        sortOrder: params.order as 'asc' | 'desc'
    });

    const categories = await getCategories('product');

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ürün Listesi</h1>
                    <p className="text-gray-500">Tüm ürünlerinizi buradan yönetebilir ve varyasyonlar oluşturabilirsiniz.</p>
                </div>
                <Link
                    href="/admin/inventory/products/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    + Yeni Ürün
                </Link>
            </div>

            {/* Filter Bar */}
            <ProductFilterBar categories={categories} />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Resim</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Başlık / SKU</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Tip</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Durum</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold">Tarih</th>
                            <th className="px-6 py-4 text-xs uppercase text-gray-400 font-bold"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {(params.q || params.category || params.status)
                                        ? 'Aramanızla eşleşen ürün bulunamadı.'
                                        : 'Henüz ürün veya hizmet eklenmemiş.'}
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
                                            {product.cover_thumb || product.cover_image ? (
                                                <img src={product.cover_thumb || product.cover_image!} alt="" className="w-full h-full object-cover" />
                                            ) : product.images?.[0] ? (
                                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl">{product.type === 'consumable' ? '🏗️' : '📦'}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{product.title}</div>
                                        <div className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${product.type === 'consumable'
                                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                            }`}>
                                            {product.type === 'consumable' ? 'Sarf Malzeme' : 'Ürün'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <span className="text-sm text-gray-600">{product.is_active ? 'Aktif' : 'Pasif'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(product.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/inventory/products/${product.id}`}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors"
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
