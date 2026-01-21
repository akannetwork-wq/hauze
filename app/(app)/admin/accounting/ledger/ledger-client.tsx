'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
    initialAccounts: any[];
}

export default function LedgerClient({ initialAccounts }: Props) {
    const [accounts] = useState(initialAccounts);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier' | 'other'>('all');
    const [sortBy, setSortBy] = useState<'code' | 'balance'>('code');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const filteredAccounts = accounts
        .filter(acc => {
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                acc.code.toLowerCase().includes(search) ||
                acc.name.toLowerCase().includes(search);

            if (filterType === 'all') return matchesSearch;
            if (filterType === 'customer') return matchesSearch && acc.code.startsWith('120');
            if (filterType === 'supplier') return matchesSearch && acc.code.startsWith('320');
            if (filterType === 'other') return matchesSearch && !acc.code.startsWith('120') && !acc.code.startsWith('320');
            return matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === 'code') {
                return sortOrder === 'asc' ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
            } else {
                const balA = a.balance || 0;
                const balB = b.balance || 0;
                return sortOrder === 'asc' ? balA - balB : balB - balA;
            }
        });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Hesap kodu veya adı ara..."
                        className="w-full bg-white border border-gray-100 rounded-2xl px-12 py-3 text-sm focus:ring-2 focus:ring-amber-500 shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 shadow-sm"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as any)}
                    >
                        <option value="all">Tüm Hesaplar</option>
                        <option value="customer">Alıcılar (120)</option>
                        <option value="supplier">Satıcılar (320)</option>
                        <option value="other">Diğer</option>
                    </select>

                    <select
                        className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 shadow-sm"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                    >
                        <option value="code">Koduna Göre</option>
                        <option value="balance">Bakiyeye Göre</option>
                    </select>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-amber-600 shadow-sm transition-all"
                    >
                        {sortOrder === 'asc' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Hesap Kodu</th>
                            <th className="px-8 py-4">Hesap Adı</th>
                            <th className="px-8 py-4">Para Birimi</th>
                            <th className="px-8 py-4 text-right">Bakiye</th>
                            <th className="px-8 py-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAccounts.map(acc => (
                            <tr key={acc.id} className="text-sm hover:bg-gray-50 transition-all group">
                                <td className="px-8 py-4 font-mono font-bold text-amber-600">{acc.code}</td>
                                <td className="px-8 py-4">
                                    <div className="font-bold text-gray-900">{acc.name}</div>
                                </td>
                                <td className="px-8 py-4 text-gray-500 font-medium">{acc.currency}</td>
                                <td className="px-8 py-4 text-right font-black">
                                    <span className={`${(acc.balance || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {(acc.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.currency}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <Link
                                        href={`/admin/accounting/ledger/${acc.id}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-amber-600 hover:text-white transition-all"
                                    >
                                        Ekstre Gör
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filteredAccounts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">Hesap bulunamadı.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
