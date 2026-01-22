import { Suspense } from 'react';
import SupplierFetcher from './supplier-fetcher';
import Link from 'next/link';

export default async function SuppliersPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/accounting" className="hover:text-indigo-600 transition-colors">Muhasebe</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Tedarikçiler</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tedarikçi Yönetimi</h1>
                </div>
            </div>

            <Suspense fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-32 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                    <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Tedarikçiler Yükleniyor...</p>
                </div>
            }>
                <SupplierFetcher />
            </Suspense>
        </div>
    );
}
