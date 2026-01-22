import { Suspense } from 'react';
import { getCategories } from '@/app/actions/inventory';
import ProductFilterBar from '../products/filter-bar';
import ProductFetcher from '../products/product-fetcher';
import Link from 'next/link';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConsumableListPage({ searchParams }: Props) {
    const params = await searchParams;
    const categories = await getCategories('consumable');

    const fetchParams = {
        search: params.q as string,
        categoryId: params.category as string,
        status: params.status as string,
        sortBy: params.sort as string,
        sortOrder: params.order as 'asc' | 'desc'
    };

    return (
        <div className="p-8 font-sans max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/inventory" className="hover:text-amber-600 transition-colors tracking-tight">Envanter</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Sarf Malzemeler</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">🏗️</span>
                        Sarf Malzemeler
                    </h1>
                </div>
                <Link
                    href="/admin/inventory/consumables/new"
                    className="bg-amber-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 hover:-translate-y-1 active:scale-95"
                >
                    + Yeni Malzeme Ekle
                </Link>
            </div>

            <ProductFilterBar categories={categories} />

            <Suspense fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-32 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                    <div className="w-16 h-16 border-4 border-amber-50 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Stok Listesi Hazırlanıyor...</p>
                </div>
            }>
                <ProductFetcher params={fetchParams} type="consumable" />
            </Suspense>
        </div>
    );
}
