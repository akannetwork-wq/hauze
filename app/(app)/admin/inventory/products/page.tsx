import Link from 'next/link';
import { Suspense } from 'react';
import ProductFilterBar from './filter-bar';
import ProductFetcher from './product-fetcher';
import { getCategories } from '@/app/actions/inventory';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductListPage({ searchParams }: Props) {
    const params = await searchParams;

    // Categories for filter bar - we fetch them here to keep the breadcrumb/headers static
    // but the table itself will be streamed.
    const categories = await getCategories('product');

    // Prepare serializable params for fetcher
    const fetchParams = {
        search: params.q as string,
        categoryId: params.category as string,
        status: params.status as string,
        sortBy: params.sort as string,
        sortOrder: params.order as 'asc' | 'desc'
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Ürün Envanteri</h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Katalog ürünlerini, stok durumlarını ve satış ayarlarını yönetin.</p>
                </div>
                <Link
                    href="/admin/inventory/products/new"
                    className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                >
                    + Yeni Ürün Ekle
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="mb-8">
                <ProductFilterBar categories={categories} />
            </div>

            <Suspense fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-24 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-[6px] border-indigo-600 border-t-transparent mx-auto mb-6"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Envanter Verileri Çekiliyor...</div>
                </div>
            }>
                <ProductFetcher params={fetchParams} />
            </Suspense>
        </div>
    );
}
