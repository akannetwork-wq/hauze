import { Suspense } from 'react';
import Link from 'next/link';
import PersonnelDashboardContent from './personnel-dashboard-content';

export default async function PersonnelDashboard() {
    return (
        <div className="p-8 font-sans max-w-[1600px] mx-auto">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-indigo-900">Personel Yönetimi</h1>
                    <p className="text-gray-500 mt-2 text-lg">Çalışanlar, görevler, puantaj ve finansal durum takibi.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/personnel/settings"
                        className="bg-white text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ayarlar
                    </Link>
                    <Link
                        href="/admin/personnel/employees/new"
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                        + Yeni Personel
                    </Link>
                </div>
            </div>

            <Suspense fallback={
                <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="bg-indigo-50/50 rounded-[2rem] p-10 h-64 animate-pulse border border-indigo-100" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-50 h-32 animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-3xl border border-gray-50 h-56 animate-pulse" />
                        ))}
                    </div>
                </div>
            }>
                <PersonnelDashboardContent />
            </Suspense>
        </div>
    );
}
