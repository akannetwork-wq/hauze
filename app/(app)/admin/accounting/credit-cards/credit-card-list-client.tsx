'use client';

import { useState, useEffect } from 'react';
import { getFinanceAccounts } from '@/app/actions/finance';
import { useRouter } from 'next/navigation';
import { CreditCardIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function CreditCardListClient() {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getFinanceAccounts('credit_card');
            setCards(data);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
                const limit = Number(card.metadata?.card_limit || 0);
                const debt = Math.abs(card.balance || 0);
                const available = limit - debt;
                const usagePercent = limit > 0 ? (debt / limit) * 100 : 0;
                const cutoffDay = card.metadata?.cutoff_day;

                return (
                    <div key={card.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col">
                        <div className="p-8 flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-gray-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <CreditCardIcon className="w-8 h-8" />
                                </div>
                                {cutoffDay && (
                                    <div className="flex flex-col items-end">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Hesap Kesim</div>
                                        <div className="flex items-center gap-1 text-sm font-black text-gray-900">
                                            <CalendarIcon className="w-4 h-4 text-indigo-500" />
                                            Her Ayın {cutoffDay}. Günü
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-black text-gray-900 mb-1">{card.name}</h3>
                            <div className="text-xs font-mono text-gray-400 mb-6">{card.code}</div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                                        <span>Kullanım Durumu</span>
                                        <span className={usagePercent > 80 ? 'text-rose-500' : 'text-gray-900'}>%{usagePercent.toFixed(0)}</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Limit</div>
                                        <div className="text-sm font-black text-gray-900">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: card.currency }).format(limit)}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-rose-500">Güncel Borç</div>
                                        <div className="text-sm font-black text-rose-600">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: card.currency }).format(debt)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-0 mt-auto">
                            <button
                                onClick={() => router.push(`?drawer=transfer&type=cc&destId=${card.id}`)}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                            >
                                <CreditCardIcon className="w-4 h-4" />
                                BORÇ ÖDE (TRANSFER YAP)
                            </button>
                        </div>
                    </div>
                );
            })}

            {cards.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-[3rem]">
                    Henüz kayıtlı kredi kartı bulunmamaktadır.
                </div>
            )}
        </div>
    );
}
