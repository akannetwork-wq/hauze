import { Suspense } from 'react';
import CategoryFetcher from './category-fetcher';
import Link from 'next/link';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryListPage({ searchParams }: Props) {
    const params = await searchParams;
    const type = (params.type as any) || 'product';

    const typeLabels: Record<string, string> = {
        product: 'Ürün',
        consumable: 'Sarf Malzeme',
        service: 'Hizmet'
    };

    return (
        <div className="p-8 font-sans max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{typeLabels[type]} Kategori Yönetimi</h1>
                    <p className="text-gray-500 mt-1">Bu bölüme özel kategori hiyerarşisini yönetin ve sıralayın.</p>
                </div>
                <Link
                    href={`/admin/inventory/categories/new?type=${type}`}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                    + Yeni {typeLabels[type]} Kategorisi
                </Link>
            </div>

            <Suspense key={type} fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-32 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                    <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Kategoriler Yükleniyor...</p>
                </div>
            }>
                <CategoryFetcher type={type} />
            </Suspense>
        </div>
    );
}
