'use client';

import { useState, useEffect } from 'react';
import { getChecks } from '@/app/actions/finance';
import { useRouter } from 'next/navigation';

export default function CheckListClient() {
    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getChecks(); // Get all checks
            setChecks(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return (
        <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">Vade / Tür</th>
                            <th className="px-8 py-5">Banka / Seri No</th>
                            <th className="px-8 py-5 text-right">Tutar</th>
                            <th className="px-8 py-5 text-center">Durum</th>
                            <th className="px-8 py-5 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {checks.map((check) => (
                            <tr key={check.id} className="group hover:bg-gray-50/50 transition-all font-medium">
                                <td className="px-8 py-6">
                                    <div className="text-sm font-black text-gray-900">{new Date(check.due_date).toLocaleDateString('tr-TR')}</div>
                                    <div className={`text-[9px] font-black uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${check.type === 'received' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {check.type === 'received' ? 'Alınan Çek' : 'Verilen Çek'}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-sm font-bold text-gray-700">{check.bank_name}</div>
                                    <div className="text-[10px] text-gray-400 font-mono italic">{check.serial_number}</div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-base font-black text-gray-900">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(check.amount)}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider
                                        ${check.status === 'portfolio' ? 'bg-amber-50 text-amber-600' :
                                            check.status === 'paid' || check.status === 'collected' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}
                                    `}>
                                        {check.status === 'portfolio' ? 'Portföyde' :
                                            check.status === 'paid' ? 'Ödendi' :
                                                check.status === 'collected' ? 'Tahsil Edildi' : check.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    {check.status === 'portfolio' && (
                                        <button
                                            onClick={() => router.push(`?drawer=transfer&type=check&checkId=${check.id}&subMode=${check.type === 'received' ? 'collect' : 'pay'}`)}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                        >
                                            {check.type === 'received' ? 'Tahsil Et' : 'Öde'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {checks.length === 0 && (
                    <div className="p-20 text-center text-gray-400 italic">Portföyde henüz çek bulunmamaktadır.</div>
                )}
            </div>
        </div>
    );
}
