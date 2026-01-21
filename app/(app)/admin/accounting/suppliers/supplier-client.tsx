'use client';

import { useState, useEffect } from 'react';
import { saveContact } from '@/app/actions/accounting';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Props {
    initialSuppliers: any[];
}

export default function SupplierClient({ initialSuppliers }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [isAdding, setIsAdding] = useState(searchParams.get('action') === 'new');
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'balance'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [form, setForm] = useState({
        type: 'supplier',
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        tax_id: '',
        tax_office: '',
        address: ''
    });

    async function handleSubmit() {
        if (!form.company_name && (!form.first_name || !form.last_name)) {
            alert('Lütfen firma adı veya ad/soyad girin.');
            return;
        }

        setLoading(true);
        const res = await saveContact(form);
        setLoading(false);

        if (res.success) {
            setSuppliers([res.data, ...suppliers]);
            setIsAdding(false);
            setForm({
                type: 'supplier',
                company_name: '',
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                tax_id: '',
                tax_office: '',
                address: ''
            });
            router.refresh();
        } else {
            alert('Hata: ' + res.error);
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
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Yeni Tedarikçi
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900">Tedarikçi Tanımla</h2>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 text-sm">Vazgeç</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Firma Adı</label>
                            <input
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={form.company_name}
                                onChange={e => setForm({ ...form, company_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İletişim Kişisi (Ad)</label>
                            <input
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={form.first_name}
                                onChange={e => setForm({ ...form, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İletişim Kişisi (Soyad)</label>
                            <input
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={form.last_name}
                                onChange={e => setForm({ ...form, last_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">E-posta</label>
                            <input
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Telefon</label>
                            <input
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Vergi No</label>
                            <input
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                                value={form.tax_id}
                                onChange={e => setForm({ ...form, tax_id: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            disabled={loading}
                            onClick={handleSubmit}
                            className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
                        >
                            {loading ? 'Kaydediliyor...' : 'Tedarikçiyi Kaydet'}
                        </button>
                    </div>
                </div>
            )}

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
                            <tr key={s.id} className="text-sm hover:bg-gray-50 transition-all group">
                                <td className="px-8 py-4">
                                    <Link href={`/admin/accounting/suppliers/${s.id}`}>
                                        <div className="font-bold text-gray-900">{s.company_name || `${s.first_name} ${s.last_name}`}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{s.first_name} {s.last_name}</div>
                                    </Link>
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
                                <td className="px-8 py-4 text-right flex justify-end">
                                    <Link href={`/admin/accounting/suppliers/${s.id}`} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-emerald-600 transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
