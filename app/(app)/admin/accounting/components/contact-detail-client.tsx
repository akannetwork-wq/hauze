'use client';

import { useState } from 'react';
import Link from 'next/link';
import TradeDialog from './trade-dialog';
import PaymentDialog from './payment-dialog';
import OrderDialog from '../../orders/components/order-dialog';
import OrderStatusBadge from '../../orders/components/order-status-badge';
import { useRouter, usePathname } from 'next/navigation';
import ContactEditor from './contact-editor';

interface Props {
    contact: any;
    account: any;
    totals: {
        debit: number;
        credit: number;
    };
    orders: any[];
    transactions: any[];
    type: 'customer' | 'supplier';
    isDrawer?: boolean;
    initialTab?: 'orders' | 'transactions' | 'summary' | 'edit';
    onRefresh?: () => void;
}

export default function ContactDetailClient({ contact, account, totals, orders, transactions, type, isDrawer = false, initialTab = 'orders', onRefresh }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<'orders' | 'transactions' | 'summary' | 'edit'>(initialTab);
    const [showTradeDialog, setShowTradeDialog] = useState(false);
    const [tradeType, setTradeType] = useState<'sale' | 'purchase'>('sale');

    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentType, setPaymentType] = useState<'collection' | 'payment'>('collection');

    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const displayName = contact.company_name || `${contact.first_name} ${contact.last_name}`;
    const balance = contact.balance || 0;

    return (
        <div className="space-y-8">
            {/* ... (rest of the component structure remains same until dialog rendering) ... */}
            {/* I will use multi_replace for the rest to be safer, replacing just the interface and header first here is fine if I match correct lines */}
            {/* But since I need to replace multiple blocks, let's just do the interface first here and then use another call for the handlers or do it all if safe. Use replace_file_content carefully. */}
            {/* Actually, I can target the whole file content areas if I am careful. Let's do interface first. */}

            {/* Header Section */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all">
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                        {!isDrawer ? (
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${type === 'customer' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {type === 'customer' ? 'MÜŞTERİ' : 'TEDARİKÇİ'}
                                    </span>
                                    <span className="text-gray-300">/</span>
                                    <span className="text-gray-400 font-mono text-xs">{account?.code || 'HESAP TANIMSIZ'}</span>
                                </div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{displayName}</h1>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${type === 'customer' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-gray-900 leading-tight">{displayName}</h1>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{account?.code || 'HESAP TANIMSIZ'}</div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50/50 px-5 py-3 rounded-2xl border border-gray-50 text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Cari Bakiye</div>
                            <div className={`text-xl font-black ${balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`p-3 rounded-xl transition-all border ${activeTab === 'edit' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-gray-500 hover:text-gray-900 border-transparent'
                                }`}
                            title="Bilgileri Düzenle"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>

                        <div className="h-8 w-px bg-gray-100 mx-1" />

                        <button
                            onClick={() => { setPaymentType('collection'); setShowPaymentDialog(true); }}
                            className="px-4 py-2.5 rounded-xl font-bold bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-sm text-xs transition-all flex items-center gap-2"
                        >
                            Tahsilat
                        </button>

                        <button
                            onClick={() => { setPaymentType('payment'); setShowPaymentDialog(true); }}
                            className="px-4 py-2.5 rounded-xl font-bold bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 shadow-sm text-xs transition-all flex items-center gap-2"
                        >
                            Tediye
                        </button>

                        <button
                            onClick={() => { setTradeType('sale'); setShowTradeDialog(true); }}
                            className="px-4 py-2.5 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs"
                        >
                            Sipariş/Satış
                        </button>

                        <button
                            onClick={() => { setTradeType('purchase'); setShowTradeDialog(true); }}
                            className="px-4 py-2.5 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all text-xs"
                        >
                            Alım Yap
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Siparişler ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'transactions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Hesap Ekstresi ({transactions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Genel Bakış [Bilgiler]
                    </button>
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Düzenle
                    </button>
                </div>

                {/* Tab Components */}
                <div className="min-h-[400px]">
                    {activeTab === 'summary' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">İletişim ve Firma Bilgileri</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">E-posta</div>
                                        <div className="text-sm text-gray-900">{contact.email || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Telefon</div>
                                        <div className="text-sm text-gray-900">{contact.phone || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Vergi Bilgileri</div>
                                        <div className="text-sm text-gray-900">{contact.tax_office} / {contact.tax_id}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Adres</div>
                                        <div className="text-sm text-gray-600 leading-relaxed">{contact.address || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <h3 className="text-lg font-bold text-gray-900">Finansal Özet</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Borç</div>
                                        <div className="text-lg font-black text-red-600">{(totals?.debit || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Alacak</div>
                                        <div className="text-lg font-black text-emerald-600">{(totals?.credit || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Sipariş Tarihi</th>
                                        <th className="px-8 py-4">Sipariş No</th>
                                        <th className="px-8 py-4">Durum</th>
                                        <th className="px-8 py-4 text-right">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.map(o => (
                                        <tr
                                            key={o.id}
                                            className="text-sm hover:bg-indigo-50/50 transition-all cursor-pointer group"
                                            onClick={() => setSelectedOrderId(o.id)}
                                        >
                                            <td className="px-8 py-4 text-gray-600">
                                                {new Date(o.created_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-8 py-4 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                #{o.id.slice(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-8 py-4">
                                                <OrderStatusBadge status={o.status} />
                                            </td>
                                            <td className="px-8 py-4 text-right font-black text-gray-900">
                                                {o.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {o.currency}
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">Henüz sipariş bulunmuyor.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Tarih</th>
                                        <th className="px-8 py-4">Açıklama</th>
                                        <th className="px-8 py-4 text-right">Borç</th>
                                        <th className="px-8 py-4 text-right">Alacak</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.map(t => (
                                        <tr key={t.id} className="text-sm hover:bg-gray-50 transition-all">
                                            <td className="px-8 py-4 text-gray-600">
                                                {new Date(t.date).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-8 py-4 text-gray-900">{t.description}</td>
                                            <td className="px-8 py-4 text-right">
                                                {t.type === 'debit' ? (
                                                    <span className="font-bold text-red-600">{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                {t.type === 'credit' ? (
                                                    <span className="font-bold text-emerald-600">{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic">Hareket bulunmuyor.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'edit' && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Kart Bilgilerini Güncelle</h3>
                            <ContactEditor
                                initialData={contact}
                                type={type as any}
                                onSuccess={() => {
                                    setActiveTab('summary');
                                    onRefresh?.();
                                }}
                            />
                        </div>
                    )}
                </div>

                {showTradeDialog && (
                    <TradeDialog
                        contact={contact}
                        type={tradeType}
                        onClose={() => setShowTradeDialog(false)}
                        onSuccess={() => {
                            router.refresh();
                            onRefresh?.();
                        }}
                    />
                )}

                {showPaymentDialog && (
                    <PaymentDialog
                        contact={contact}
                        account={account}
                        type={paymentType}
                        onClose={() => setShowPaymentDialog(false)}
                        onSuccess={() => {
                            router.refresh();
                            onRefresh?.();
                        }}
                    />
                )}

                {selectedOrderId && (
                    <OrderDialog
                        orderId={selectedOrderId}
                        onClose={() => setSelectedOrderId(null)}
                        onSuccess={() => {
                            router.refresh();
                            onRefresh?.();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
