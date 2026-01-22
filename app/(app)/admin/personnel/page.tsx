import Link from 'next/link';
import { getEmployees, getPersonnelTasks, getAttendance, getSalaryStats } from '@/app/actions/personnel';

import { headers } from 'next/headers';

export default async function PersonnelDashboard() {
    // Access a dynamic data source first to mark the segment as dynamic for deterministic shells in Next.js 16
    await headers();

    const [employees, tasks, attendance, salaryStats] = await Promise.all([
        getEmployees(),
        getPersonnelTasks(),
        getAttendance({ month: new Date().toISOString().substring(0, 7) }),
        getSalaryStats()
    ]);

    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

    // Revision: Only daily workers' positive earnings (hakediş)
    const totalDailyBalance = employees
        .filter(emp => emp.worker_type === 'daily')
        .reduce((acc, emp) => {
            const balance = Number((emp as any).personnel_balances?.[0]?.balance) || 0;
            return acc + (balance > 0 ? balance : 0);
        }, 0);

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

            {/* Boss Mode: Salary Week Highlights */}
            {(salaryStats.isMonthlySalaryWeek || salaryStats.isWeeklyPaymentWeek) && (
                <div className="mb-10 bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-[2rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-16 -mb-16"></div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-amber-400 text-indigo-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Maaş Haftası
                                </span>
                                <span className="text-indigo-200 text-sm font-medium">
                                    Ödeme Günü: {salaryStats.isMonthlySalaryWeek ? `Ayın ${salaryStats.settings.salary_payment_day}. günü` : 'Bu hafta sonu'}
                                </span>
                            </div>
                            <h2 className="text-4xl font-black mb-4 leading-tight">
                                Patron, bu hafta toplam <br />
                                <span className="text-amber-400">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(salaryStats.totalDueThisWeek)}
                                </span> ödeme planlanıyor.
                            </h2>
                            <p className="text-indigo-100/70 max-w-md">
                                Sabit maaşlı personellerin hak edişleri ve yevmiyeli personelin biriken alacaklarının toplamıdır.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-6">
                            <Link
                                href="/admin/personnel/employees?type=monthly"
                                className="flex justify-between items-center hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors group/stat"
                            >
                                <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Aylık Maaşlar</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-black">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(salaryStats.monthlyTotal)}</span>
                                    <span className="text-indigo-400 opacity-0 group-hover/stat:opacity-100 transition-opacity">→</span>
                                </div>
                            </Link>
                            <div className="h-px bg-white/10 w-full"></div>
                            <Link
                                href="/admin/personnel/employees?type=daily"
                                className="flex justify-between items-center hover:bg-white/5 p-2 -m-2 rounded-xl transition-colors group/stat"
                            >
                                <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Haftalık/Günlük</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-black">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(salaryStats.weeklyTotal)}</span>
                                    <span className="text-indigo-400 opacity-0 group-hover/stat:opacity-100 transition-opacity">→</span>
                                </div>
                            </Link>
                            <Link
                                href="/admin/personnel/finance"
                                className="block w-full text-center bg-amber-400 text-indigo-900 font-black py-4 rounded-xl hover:bg-amber-300 transition-colors text-sm shadow-lg shadow-amber-400/20"
                            >
                                Ödemeleri Yap
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-b-4 border-b-indigo-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">👨‍💼</div>
                        <h3 className="font-bold text-gray-600 uppercase text-xs tracking-widest">Toplam Çalışan</h3>
                    </div>
                    <div className="text-4xl font-black text-gray-900">{employees.length}</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-b-4 border-b-amber-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📋</div>
                        <h3 className="font-bold text-gray-600 uppercase text-xs tracking-widest">Aktif Görevler</h3>
                    </div>
                    <div className="text-4xl font-black text-gray-900">{activeTasks.length}</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-b-4 border-b-emerald-500 relative group transition-all hover:shadow-lg">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">💰</div>
                        <h3 className="font-bold text-gray-600 uppercase text-xs tracking-widest">Yevmiyeli Hakediş</h3>
                    </div>
                    <div className="text-4xl font-black text-gray-900 text-emerald-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalDailyBalance)}
                    </div>
                    <Link
                        href="/admin/personnel/employees?type=daily"
                        className="absolute top-6 right-6 text-xs text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-2 py-1 rounded-lg"
                    >
                        Detaylar →
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-b-4 border-b-rose-500">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📅</div>
                        <h3 className="font-bold text-gray-600 uppercase text-xs tracking-widest">Bugünlük Puantaj</h3>
                    </div>
                    <div className="text-4xl font-black text-gray-900">
                        {attendance.filter(a => a.date === new Date().toISOString().substring(0, 10)).length} / {employees.length}
                    </div>
                </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 👨‍💼 ÇALIŞANLAR */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900">Çalışan Rehberi</h2>
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed h-10">
                            Tüm personelin iletişim, pozisyon ve maaş bilgilerini yönetin.
                        </p>
                    </div>
                    <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-50">
                        <Link
                            href="/admin/personnel/employees"
                            className="block w-full text-center bg-white border border-gray-200 text-indigo-600 font-bold py-3 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all text-sm shadow-sm"
                        >
                            Çalışanları Görüntüle
                        </Link>
                    </div>
                </div>

                {/* 📅 PUANTAJ */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900">Puantaj Takibi</h2>
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed h-10">
                            Günlük çalışma saatleri, fazla mesailer ve devamsızlıklar.
                        </p>
                    </div>
                    <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-50">
                        <Link
                            href="/admin/personnel/attendance"
                            className="block w-full text-center bg-white border border-gray-200 text-amber-600 font-bold py-3 rounded-2xl hover:bg-amber-600 hover:text-white transition-all text-sm shadow-sm"
                        >
                            Puantaj Girişi Yap
                        </Link>
                    </div>
                </div>

                {/* 💰 BORDRO & FİNANS */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900">Finans & Bordro</h2>
                        <p className="text-gray-500 text-sm mt-2 leading-relaxed h-10">
                            Avanslar, ödemeler, hakedişler ve borç/alacak durumu takibi.
                        </p>
                    </div>
                    <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-50">
                        <Link
                            href="/admin/personnel/finance"
                            className="block w-full text-center bg-white border border-gray-200 text-emerald-600 font-bold py-3 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all text-sm shadow-sm"
                        >
                            Ödeme & Hakediş Yönetimi
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
