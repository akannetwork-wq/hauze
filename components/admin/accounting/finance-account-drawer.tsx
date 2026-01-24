'use client';

import React, { useState, useEffect } from 'react';
import Drawer from '@/components/admin/ui/drawer';
import { getTransactions } from '@/app/actions/accounting';

interface Props {
    account: any;
    onClose: () => void;
}

export default function FinanceAccountDrawer({ account, onClose }: Props) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!account?.id) return;
            setLoading(true);
            const data = await getTransactions(account.id);
            setTransactions(data || []);
            setLoading(false);
        }
        loadData();
    }, [account]);

    if (!account) return null;

    return (
        <Drawer
            isOpen={true}
            onClose={onClose}
            title={account.name}
            subtitle={`${account.code} • ${account.currency}`}
        >
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
                    <div className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Güncel Bakiye</div>
                    <div className="text-3xl font-black">
                        {(account.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {account.currency}
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
                            <span>📊</span> Hesap Hareketleri
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                <tr>
                                    <th className="px-5 py-4">Tarih</th>
                                    <th className="px-5 py-4">Açıklama</th>
                                    <th className="px-5 py-4 text-right">Giriş</th>
                                    <th className="px-5 py-4 text-right">Çıkış</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap text-gray-500 font-medium text-xs">
                                            {new Date(t.date).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-gray-900 font-bold text-xs">{t.description}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">{t.document_type}</div>
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-emerald-600 text-xs whitespace-nowrap">
                                            {t.type === 'debit' ? t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-red-600 text-xs whitespace-nowrap">
                                            {t.type === 'credit' ? t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-12 text-center text-gray-400 italic text-xs">
                                            Bu hesaba ait işlem bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Drawer>
    );
}
