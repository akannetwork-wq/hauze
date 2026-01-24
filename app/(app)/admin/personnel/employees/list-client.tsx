'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface Props {
    employees: any[];
}

export default function EmployeeListClient({ employees: initialEmployees }: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [employees, setEmployees] = useState(initialEmployees);

    useEffect(() => {
        setEmployees(initialEmployees);
    }, [initialEmployees]);
    const [search, setSearch] = useState('');
    const currentType = searchParams.get('type') || 'all';

    const [hasMore, setHasMore] = useState(initialEmployees.length === 50);
    const [page, setPage] = useState(1);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    async function handleLoadMore() {
        if (isMoreLoading) return;
        setIsMoreLoading(true);
        const nextOffset = page * 50;
        try {
            const { getEmployees } = await import('@/app/actions/personnel');
            const nextBatch = await getEmployees(50, nextOffset);

            if (nextBatch.length > 0) {
                setEmployees(prev => [...prev, ...nextBatch]);
                setPage(prev => prev + 1);
                setHasMore(nextBatch.length === 50);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more employees:', error);
        } finally {
            setIsMoreLoading(false);
        }
    }

    const setType = (type: string) => {
        const params = new URLSearchParams(searchParams);
        if (type === 'all') params.delete('type');
        else params.set('type', type);
        router.push(`?${params.toString()}`);
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
                emp.position?.toLowerCase().includes(search.toLowerCase());

            const matchesType = currentType === 'all' || emp.worker_type === currentType;

            return matchesSearch && matchesType;
        });
    }, [employees, search, currentType]);

    return (
        <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 relative w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Personel adı veya pozisyon ara..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                </div>
                <div className="flex bg-gray-50 p-1 rounded-2xl gap-1">
                    {[
                        { label: 'Hepsi', value: 'all' },
                        { label: 'Aylık', value: 'monthly' },
                        { label: 'Günlük', value: 'daily' }
                    ].map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setType(t.value)}
                            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${currentType === t.value
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Personel</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Pozisyon</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Çalışma Tipi</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Durum / Bakiye</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredEmployees.map((emp) => {
                            const balance = Number(emp.personnel_balances?.[0]?.balance || 0);
                            return (
                                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <Link href={`?drawer=edit-employee&id=${emp.id}`} scroll={false} className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg shadow-inner">👤</div>
                                            <div>
                                                <div className="font-bold text-gray-900 leading-tight">{emp.first_name} {emp.last_name}</div>
                                                <div className="text-xs text-gray-400 mt-1">{emp.phone || emp.email || 'İletişim yok'}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-gray-600 font-medium">{emp.position || '-'}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${emp.worker_type === 'monthly' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {emp.worker_type === 'monthly' ? 'Aylık' : 'Günlük'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className={`font-mono font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(balance)}
                                        </div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold mt-1">GÜNCEL HAKEDİŞ</div>
                                    </td>
                                    <td className="px-6 py-5 text-right">

                                    </td>
                                </tr>
                            );
                        })}
                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                                    Arama kriterlerine uygun personel bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-8 border-t border-gray-50 flex justify-center bg-gray-50/30">
                        <button
                            onClick={handleLoadMore}
                            disabled={isMoreLoading}
                            className="bg-white border border-gray-200 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                        >
                            {isMoreLoading ? 'Yükleniyor...' : 'Daha Fazla Kayıt Yükle'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
