import { Suspense } from 'react';
import PagesFetcher from './page-fetcher';

export default async function PagesIndex() {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Site Yöneticisi</h1>
                    <p className="text-gray-500 mt-1">Sitenizin sayfalarını yönetin ve yeni içerikler oluşturun.</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sayfalar Yükleniyor...</div>
            }>
                <PagesFetcher />
            </Suspense>
        </div>
    );
}
