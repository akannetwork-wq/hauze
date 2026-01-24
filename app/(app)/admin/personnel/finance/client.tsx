'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { accrueBulkSalaries } from '@/app/actions/personnel';
import SalaryAccrualDialog from './salary-accrual-dialog';
import toast from 'react-hot-toast';
import { CurrencyDollarIcon, UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Fallback if not available, verify imports

interface Props {
    employees: any[];
}

export default function PersonnelFinanceClient({ employees }: Props) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isBulkLoading, setIsBulkLoading] = useState(false);

    const stats = employees.reduce((acc, emp) => {
        const bal = Number(emp.personnel_balances?.[0]?.balance || 0);
        if (bal >= 0) acc.totalCredit += bal;
        else acc.totalDebt += Math.abs(bal);
        return acc;
    }, { totalCredit: 0, totalDebt: 0 });

    const filteredEmployees = employees.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase())
    );

    const handleBulkAccrual = async () => {
        if (!confirm('Tüm maaşlı çalışanlar için bu ayın maaş tahakkuku yapılacaktır. Devam etmek istiyor musunuz?')) return;

        setIsBulkLoading(true);
        const currentMonth = new Date().toISOString().substring(0, 7);

        try {
            const result = await accrueBulkSalaries(currentMonth);
            if (result.success) {
                toast.success(result.message || 'Toplu tahakkuk işlemi tamamlandı.');
                router.refresh();
            } else {
                toast.error(result.error || 'İşlem sırasında hata oluştu.');
            }
        } catch (error) {
            toast.error('Beklenmedik bir hata oluştu.');
        } finally {
            setIsBulkLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <SalaryAccrualDialog
                isOpen={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                employee={selectedEmployee}
            />

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Toplam Personel Alacağı (Hakediş)</div>
                        <div className="text-4xl font-black text-emerald-700">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalCredit)}
                        </div>
                        <p className="text-emerald-600/70 text-xs mt-4 font-bold uppercase tracking-tight">Oluşan hakedişlerden henüz ödenmemiş olan toplam tutar.</p>
                    </div>
                    {/* Decorative Icon */}
                    <div className="absolute right-4 bottom-4 opacity-10">
                        {/* If heroicons are available */}
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.29 0 2.13-.77 2.13-2.11 0-2.85-6.65-2.22-6.65-8.31 0-2.03 1.62-3.24 3.3-3.6V2h2.67v1.93c1.46.33 2.62 1.3 3.01 3.08h-2.01c-.34-1.04-1.18-1.55-2.21-1.55-1.15 0-1.87.82-1.87 2.05 0 2.87 6.67 2.21 6.67 8.32 0 2.01-1.66 3.23-3.59 3.59z" /></svg>
                    </div>
                </div>

                <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">Toplam Personel Borcu (Avans)</div>
                        <div className="text-4xl font-black text-rose-700">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalDebt)}
                        </div>
                        <p className="text-rose-600/70 text-xs mt-4 font-bold uppercase tracking-tight">Personellere verilmiş olan nakit avans ve borçlar toplamı.</p>
                    </div>
                    <div className="absolute right-4 bottom-4 opacity-10 text-rose-900">
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.29 0 2.13-.77 2.13-2.11 0-2.85-6.65-2.22-6.65-8.31 0-2.03 1.62-3.24 3.3-3.6V2h2.67v1.93c1.46.33 2.62 1.3 3.01 3.08h-2.01c-.34-1.04-1.18-1.55-2.21-1.55-1.15 0-1.87.82-1.87 2.05 0 2.87 6.67 2.21 6.67 8.32 0 2.01-1.66 3.23-3.59 3.59z" /></svg>
                    </div>
                </div>
            </div>

            {/* List with Financial Focus */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-gray-900 text-lg">Maaş & Bakiye Durumu</h3>
                        <button
                            onClick={handleBulkAccrual}
                            disabled={isBulkLoading}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isBulkLoading ? 'İşleniyor...' : '⚡️ Toplu Maaş Tahakkuk'}
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {/* Search Icon */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Personel ara..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Personel</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Çalışma Tipi</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Maaş / Yevmiye</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Net Bakiye</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredEmployees.map(emp => {
                            const balance = Number(emp.personnel_balances?.[0]?.balance || 0);
                            return (
                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{emp.first_name} {emp.last_name}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{emp.position || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${emp.worker_type === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {emp.worker_type === 'monthly' ? 'Aylık' : 'Günlük'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-mono font-bold text-gray-700">
                                            {new Intl.NumberFormat('tr-TR').format(emp.worker_type === 'monthly' ? emp.base_salary : emp.daily_rate)} TL
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-mono font-black text-lg ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(balance)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {emp.worker_type === 'monthly' && (
                                                <button
                                                    onClick={() => setSelectedEmployee(emp)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg"
                                                >
                                                    Maaş Tahakkuk
                                                </button>
                                            )}
                                            <Link
                                                href={`/admin/personnel/employees/${emp.id}`}
                                                className="text-gray-400 hover:text-indigo-600 font-bold p-2"
                                                title="Detaylar"
                                            >
                                                →
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
