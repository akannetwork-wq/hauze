'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
    employees: any[];
}

export default function PersonnelFinanceClient({ employees }: Props) {
    const [search, setSearch] = useState('');

    const stats = employees.reduce((acc, emp) => {
        const bal = Number(emp.personnel_balances?.[0]?.balance || 0);
        if (bal >= 0) acc.totalCredit += bal;
        else acc.totalDebt += Math.abs(bal);
        return acc;
    }, { totalCredit: 0, totalDebt: 0 });

    const filteredEmployees = employees.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm">
                    <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Toplam Personel Alacağı (Hakediş)</div>
                    <div className="text-4xl font-black text-emerald-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalCredit)}
                    </div>
                    <p className="text-emerald-600/70 text-xs mt-4 font-bold uppercase tracking-tight">Oluşan hakedişlerden henüz ödenmemiş olan toplam tutar.</p>
                </div>

                <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 shadow-sm">
                    <div className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">Toplam Personel Borcu (Avans)</div>
                    <div className="text-4xl font-black text-rose-700">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalDebt)}
                    </div>
                    <p className="text-rose-600/70 text-xs mt-4 font-bold uppercase tracking-tight">Personellere verilmiş olan nakit avans ve borçlar toplamı.</p>
                </div>
            </div>

            {/* List with Financial Focus */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Maaş & Bakiye Durumu</h3>
                    <div className="relative w-64">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
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
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredEmployees.map(emp => {
                            const balance = Number(emp.personnel_balances?.[0]?.balance || 0);
                            return (
                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
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
                                        <Link
                                            href={`/admin/personnel/employees/${emp.id}`}
                                            className="text-indigo-600 hover:underline text-xs font-bold"
                                        >
                                            DETAY / ÖDEME
                                        </Link>
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
