import { Suspense } from 'react';
import CustomerFetcher from './customer-fetcher';
import Link from 'next/link';

export default async function CustomersPage() {
    return (
        <div className="p-8">
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        <Link href="/admin/accounting" className="hover:text-indigo-600 transition-colors">Muhasebe</Link>
                        <span>/</span>
                        <span className="text-gray-900">Müşteriler</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Müşteri Yönetimi</h1>
                    <p className="text-gray-400 text-sm font-medium mt-2">Cari hesapları, bakiye durumlarını ve müşteri ilişkilerini yönetin.</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-24 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-[6px] border-indigo-600 border-t-transparent mx-auto mb-6"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Cari Kayıtlar Yükleniyor...</div>
                </div>
            }>
                <CustomerFetcher />
            </Suspense>
        </div>
    );
}
