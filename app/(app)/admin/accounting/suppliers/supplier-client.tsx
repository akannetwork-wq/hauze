'use client';

import { useState } from 'react';
import { saveContact } from '@/app/actions/accounting';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Props {
    initialSuppliers: any[];
}

export default function SupplierClient({ initialSuppliers }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [loading, setLoading] = useState(false);

    const [hasMore, setHasMore] = useState(initialSuppliers.length === 50);
    const [page, setPage] = useState(1);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'balance'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    async function handleLoadMore() {
        if (isMoreLoading) return;
        setIsMoreLoading(true);
        const nextOffset = page * 50;
        try {
            const { getContacts } = await import('@/app/actions/accounting');
            const nextBatch = await getContacts('supplier', 50, nextOffset);

            if (nextBatch.length > 0) {
                setSuppliers(prev => [...prev, ...nextBatch]);
                setPage(prev => prev + 1);
                setHasMore(nextBatch.length === 50);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more suppliers:', error);
        } finally {
            setIsMoreLoading(false);
        }
    }


    const filteredSuppliers = suppliers
        .filter(s => {
            const search = searchTerm.toLowerCase();
            return (
                (s.company_name || '').toLowerCase().includes(search) ||
                (s.first_name || '').toLowerCase().includes(search) ||
                (s.last_name || '').toLowerCase().includes(search) ||
                (s.email || '').toLowerCase().includes(search) ||
                (s.phone || '').toLowerCase().includes(search)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = (a.company_name || `${a.first_name} ${a.last_name}`).toLowerCase();
                const nameB = (b.company_name || `${b.first_name} ${b.last_name}`).toLowerCase();
                return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            } else {
                const balA = a.balance || 0;
                const balB = b.balance || 0;
                return sortOrder === 'asc' ? balA - balB : balB - balA;
            }
        });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Tedarikçi ara..."
                        className="w-full bg-white border border-gray-100 rounded-2xl px-12 py-3 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                    >
                        <option value="name">İsme Göre Sırala</option>
                        <option value="balance">Bakiyeye Göre Sırala</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-emerald-600 shadow-sm transition-all"
                    >
                        {sortOrder === 'asc' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
                        )}
                    </button>
                    <Link
                        href={`${pathname}?drawer=add-supplier`}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Tedarikçi
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Tedarikçi / Firma</th>
                            <th className="px-8 py-4">İletişim</th>
                            <th className="px-8 py-4 text-right">Bakiye</th>
                            <th className="px-8 py-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredSuppliers.map(s => (
                            <tr
                                key={s.id}
                                className="text-sm hover:bg-gray-50 transition-all group cursor-pointer"
                                onClick={() => router.push(`${pathname}?drawer=contact-detail&id=${s.id}`, { scroll: false })}
                            >
                                <td className="px-8 py-4">
                                    <div className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                        {s.company_name || `${s.first_name} ${s.last_name}`}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium">{s.first_name} {s.last_name}</div>
                                </td>
                                <td className="px-8 py-4">
                                    <div className="text-gray-600">{s.phone}</div>
                                    <div className="text-xs text-gray-400">{s.email}</div>
                                </td>
                                <td className="px-8 py-4 text-right font-black">
                                    <span className={`${(s.balance || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {(s.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`${pathname}?drawer=contact-detail&id=${s.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-emerald-600 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-8 border-t border-gray-50 flex justify-center bg-gray-50/30">
                        <button
                            onClick={handleLoadMore}
                            disabled={isMoreLoading}
                            className="bg-white border border-gray-200 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                        >
                            {isMoreLoading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
