import { Suspense } from 'react';
import EmployeeFetcher from './employee-fetcher';
import Link from 'next/link';

export default async function EmployeeListPage() {
    return (
        <div className="p-8">
            <div className="mb-12 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                        <Link href="/admin/personnel" className="hover:text-indigo-600 transition-colors">Personel</Link>
                        <span>/</span>
                        <span className="text-gray-900">Rehber</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Personel Rehberi</h1>
                    <p className="text-gray-400 text-sm font-medium mt-2">Ekibinizi, çalışma tiplerini ve finansal durumlarını yönetin.</p>
                </div>
                <Link
                    href="?drawer=add-employee"
                    scroll={false}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                >
                    + Yeni Kayıt Ekle
                </Link>
            </div>

            <Suspense fallback={
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-24 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-[6px] border-indigo-600 border-t-transparent mx-auto mb-6"></div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Personel Listesi Yükleniyor...</div>
                </div>
            }>
                <EmployeeFetcher />
            </Suspense>
        </div>
    );
}
