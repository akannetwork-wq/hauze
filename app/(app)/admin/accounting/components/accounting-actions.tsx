'use client';

import { useState } from 'react';
import PaymentDialog from './payment-dialog';
import { TransactionType } from '@/app/actions/finance';
import { PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowsRightLeftIcon, TicketIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Drawer from '@/components/admin/ui/drawer';

export default function AccountingActions() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [txType, setTxType] = useState<'collection' | 'payment'>('collection');

    const openFor = (type: 'collection' | 'payment') => {
        setTxType(type);
        setIsOpen(true);
    };

    return (
        <>
            <div className="flex gap-3 mb-8">
                <button
                    onClick={() => openFor('collection')}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-emerald-200"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Tahsilat Ekle (Giriş)
                </button>
                <button
                    onClick={() => openFor('payment')}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-red-200"
                >
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    Tediye Ekle (Çıkış)
                </button>
                <div className="w-[1px] h-10 bg-gray-100 mx-2 self-center"></div>
                <button
                    onClick={() => router.push('?drawer=transfer&type=transfer')}
                    className="flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-200 text-indigo-600 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm hover:shadow-indigo-50"
                >
                    <ArrowsRightLeftIcon className="w-5 h-5 opacity-70" />
                    Virman / Transfer
                </button>
                <button
                    onClick={() => router.push('?drawer=transfer&type=check')}
                    className="flex items-center gap-2 bg-white border border-gray-200 hover:border-amber-200 text-amber-600 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm hover:shadow-amber-50"
                >
                    <TicketIcon className="w-5 h-5 opacity-70" />
                    Çek İşlemleri
                </button>
            </div>

            {isOpen && (
                <PaymentDialog
                    // No contact passed -> enables search mode
                    onClose={() => setIsOpen(false)}
                    onSuccess={() => setIsOpen(false)}
                    type={txType}
                />
            )}
        </>
    );
}
