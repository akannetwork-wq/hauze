'use client';

import { useState } from 'react';
import { addTransaction } from '@/app/actions/accounting';
import { useRouter } from 'next/navigation';

interface Props {
    account: any;
    initialTransactions: any[];
}

export default function TransactionClient({ account, initialTransactions }: Props) {
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        account_id: account.id,
        type: 'debit' as 'debit' | 'credit',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
        document_type: 'receipt'
    });

    async function handleSubmit() {
        if (form.amount <= 0) {
            alert('Lütfen geçerli bir tutar girin.');
            return;
        }

        setLoading(true);
        const res = await addTransaction(form);
        setLoading(false);

        if (res.success) {
            setIsAdding(false);
            setForm({
                account_id: account.id,
                type: 'debit',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                description: '',
                document_type: 'receipt'
            });
            router.refresh();
        } else {
            alert('Hata: ' + res.error);
        }
    }

    return (
        <div className="space-y-8">
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Yeni Hareket Ekle
                </button>
            ) : (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900">Hesap Hareketi Kaydet</h2>
                        <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 text-sm">Vazgeç</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İşlem Tipi</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setForm({ ...form, type: 'debit' })}
                                    className={`py-3 rounded-2xl text-xs font-black transition-all ${form.type === 'debit' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}
                                >
                                    BORÇ (DEBIT)
                                </button>
                                <button
                                    onClick={() => setForm({ ...form, type: 'credit' })}
                                    className={`py-3 rounded-2xl text-xs font-black transition-all ${form.type === 'credit' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}
                                >
                                    ALACAK (CREDIT)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Tutar</label>
                            <input
                                type="number" step="0.01"
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 font-bold"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Tarih</label>
                            <input
                                type="date"
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Belge Tipi</label>
                            <select
                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                value={form.document_type}
                                onChange={e => setForm({ ...form, document_type: e.target.value })}
                            >
                                <option value="receipt">Fiş / Makbuz</option>
                                <option value="invoice">Fatura</option>
                                <option value="payment">Ödeme Belgesi</option>
                                <option value="transfer">Transfer</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Açıklama</label>
                        <textarea
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            placeholder="İşlem detaylarını yazın..."
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            disabled={loading}
                            onClick={handleSubmit}
                            className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg"
                        >
                            {loading ? 'Kaydediliyor...' : 'İşlemi Kaydet'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Hesap Ekstresi</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Tarih</th>
                            <th className="px-8 py-4">Açıklama</th>
                            <th className="px-8 py-4">Belge</th>
                            <th className="px-8 py-4 text-right">Borç</th>
                            <th className="px-8 py-4 text-right">Alacak</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {initialTransactions.map(t => (
                            <tr key={t.id} className="text-sm hover:bg-gray-50 transition-colors">
                                <td className="px-8 py-4 text-gray-500 whitespace-nowrap">
                                    {new Date(t.date).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-8 py-4 font-medium text-gray-900">{t.description}</td>
                                <td className="px-8 py-4">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-[10px] uppercase font-bold">
                                        {t.document_type}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-right font-bold text-indigo-600">
                                    {t.type === 'debit' ? t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="px-8 py-4 text-right font-bold text-emerald-600">
                                    {t.type === 'credit' ? t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : ''}
                                </td>
                            </tr>
                        ))}
                        {initialTransactions.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic font-medium">Bu hesaba ait henüz bir işlem bulunmamaktadır.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
