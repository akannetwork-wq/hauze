'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ProductTableProps {
    initialProducts: any[];
    params: {
        search?: string;
        categoryId?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    };
    type: 'product' | 'consumable' | 'service';
}

export default function ProductListTable({ initialProducts, params, type }: ProductTableProps) {
    const [products, setProducts] = useState(initialProducts);
    const [hasMore, setHasMore] = useState(initialProducts.length === 50);
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
                type,
                limit: 50,
                offset: nextOffset
            });

            if (nextBatch.length > 0) {
                setProducts(prev => [...prev, ...nextBatch]);
                setPage(prev => prev + 1);
                setHasMore(nextBatch.length === 50);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more items:', error);
        } finally {
            setIsMoreLoading(false);
        }
    }

    const typeIcons = {
        product: '📦',
        consumable: '🏗️',
        service: '🛠️'
    };

    const typeLabel = {
        product: 'ÜRÜN',
        consumable: 'SARF',
        service: 'HİZMET'
    };

    const typeColor = {
        product: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        consumable: 'bg-amber-50 text-amber-700 border-amber-100',
        service: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };

    const editPrefix = {
        product: 'products',
        consumable: 'consumables',
        service: 'services'
    };

    return (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Görsel</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Bilgi</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Stok</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Tür</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Durum</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest">Tarih</th>
                        <th className="px-8 py-5 text-[10px] uppercase text-gray-400 font-black tracking-widest"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {products.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic font-medium">
                                Kayıt bulunamadı.
                            </td>
                        </tr>
                    ) : (
                        products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50/50 transition-all group">
                                <td className="px-8 py-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                                        {product.cover_thumb || product.cover_image ? (
                                            <img src={product.cover_thumb || product.cover_image!} alt="" className="w-full h-full object-cover" />
                                        ) : product.images?.[0] ? (
                                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-2xl">{typeIcons[product.type as keyof typeof typeIcons] || '📦'}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{product.title}</div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-1 font-black bg-gray-100 px-2 py-0.5 rounded-md inline-block">{product.sku}</div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className={`text-lg font-black ${product.stock < 10 ? 'text-rose-600' : 'text-gray-900'}`}>{product.stock ?? 0}</span>
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{product.unit || 'ADET'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${typeColor[product.type as keyof typeof typeColor]}`}>
                                        {typeIcons[product.type as keyof typeof typeIcons]} {typeLabel[product.type as keyof typeof typeLabel]}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-gray-300'}`} />
                                        <span className={`text-[11px] font-black uppercase tracking-wide ${product.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                                            {product.is_active ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-[11px] text-gray-400 font-bold">
                                    {new Date(product.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <Link
                                        href={`/admin/inventory/${editPrefix[product.type as keyof typeof editPrefix]}/${product.id}`}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all inline-block font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-indigo-100"
                                    >
                                        Düzenle
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
                        className="bg-white border border-gray-200 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                    >
                        {isMoreLoading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                    </button>
                </div>
            )}
        </div>
    );
}
