import Link from 'next/link';
import { Suspense } from 'react';
import ServiceFetcher from './service-fetcher';
import { getCategories } from '@/app/actions/inventory';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ServiceListPage({ searchParams }: Props) {
    const params = await searchParams;

    // Fetch categories for services
    const categories = await getCategories('service');

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
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Hizmet Envanteri</h1>
                    <p className="text-gray-400 text-sm font-medium mt-1">Müşterilere sunulan hizmetleri, varyasyonları ve akıllı fiyatlandırma kurallarını yönetin.</p>
                </div>
                <Link
                    href="/admin/inventory/services/new"
                    className="px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all"
                >
                    + Yeni Hizmet Tanımla
                </Link>
            </div>

            <Suspense fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-24 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-[6px] border-emerald-600 border-t-transparent mx-auto mb-6"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Hizmet Verileri Çekiliyor...</div>
                </div>
            }>
                <ServiceFetcher params={fetchParams} />
            </Suspense>
        </div>
    );
}
