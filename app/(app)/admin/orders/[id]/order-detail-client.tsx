'use client';

import React, { useState } from 'react';
import { updateOrderStatus, markOrderAsPaid } from '@/app/actions/orders';
import OrderStatusBadge from '../components/order-status-badge';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Props {
    order: any;
}

export default function OrderDetailClient({ order }: Props) {
    const [status, setStatus] = useState(order.status);
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
    const [loading, setLoading] = useState(false);

    const handleStatusUpdate = async (newStatus: string) => {
        setLoading(true);
        const res = await updateOrderStatus(order.id, newStatus);
        if (res.success) {
            setStatus(newStatus);
            toast.success('Sipariş durumu güncellendi.');
        } else {
            toast.error('Hata: ' + res.error);
        }
        setLoading(false);
    };

    const handlePaymentUpdate = async () => {
        if (!confirm('Bu siparişi ödendi olarak işaretlemek ve cari hesaba tahsilat işlemek istediğinize emin misiniz?')) return;

        setLoading(true);
        // Default to 'eft' as the closing method if it was originally EFT, 
        // or just use 'eft' as the standard confirmed method.
        const res = await markOrderAsPaid(order.id, 'eft');
        if (res.success) {
            setPaymentStatus('paid');
            toast.success('Ödeme kaydedildi ve cari hesap kapatıldı.');
        } else {
            toast.error('Hata: ' + res.error);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <a href="/admin/orders" className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all shadow-sm">←</a>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sipariş #{order.id.slice(0, 8).toUpperCase()}</h1>
                            <OrderStatusBadge status={status} />
                        </div>
                        <p className="text-gray-500 mt-1">{new Date(order.created_at).toLocaleString('tr-TR')} • {order.type === 'sale' ? 'Satış Siparişi' : 'Alın Siparişi'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Workflow Controls */}
                    {status === 'pending' && (
                        <button
                            onClick={() => handleStatusUpdate('preparing')}
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:-translate-y-1 disabled:opacity-50"
                        >
                            📦 Hazırlamaya Başla
                        </button>
                    )}
                    {status === 'preparing' && (
                        <button
                            onClick={() => handleStatusUpdate('ready')}
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:-translate-y-1 disabled:opacity-50"
                        >
                            ✅ Hazır Olarak İşaretle
                        </button>
                    )}
                    {status === 'ready' && (
                        <button
                            onClick={() => handleStatusUpdate('shipped')}
                            disabled={loading}
                            className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all hover:-translate-y-1 disabled:opacity-50"
                        >
                            🚚 Kargolandı
                        </button>
                    )}
                    {(status === 'shipped' || status === 'completed') && (
                        <button
                            onClick={() => handleStatusUpdate('delivered')}
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-green-100 hover:bg-green-700 transition-all hover:-translate-y-1 disabled:opacity-50"
                        >
                            🏠 Teslim Edildi
                        </button>
                    )}
                    {status !== 'delivered' && status !== 'cancelled' && (
                        <button
                            onClick={() => handleStatusUpdate('cancelled')}
                            disabled={loading}
                            className="bg-white border border-red-100 text-red-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                            ✕ İptal Et
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Items */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                                <span>🛒</span> Sipariş İçeriği
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <tr>
                                        <th className="px-8 py-4">Ürün</th>
                                        <th className="px-8 py-4 text-center">Birim Fiyat</th>
                                        <th className="px-8 py-4 text-center">Miktar</th>
                                        <th className="px-8 py-4 text-right">Ara Toplam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.lines.map((line: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-gray-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-gray-900">{line.title}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{line.sku}</div>
                                            </td>
                                            <td className="px-8 py-6 text-center text-sm font-medium text-gray-600">
                                                {line.price.toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="inline-flex px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-900">
                                                    {line.quantity}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right font-black text-gray-900">
                                                {(line.quantity * line.price).toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={3} className="px-8 py-6 text-right text-sm font-bold text-gray-500 uppercase tracking-widest">Genel Toplam</td>
                                        <td className="px-8 py-6 text-right text-2xl font-black text-indigo-600">
                                            {order.total.toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {order.description && (
                        <div className="bg-white rounded-[2rem] border border-gray-100 p-8">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>📝</span> Sipariş Notu
                            </h3>
                            <p className="text-gray-700 leading-relaxed italic">{order.description}</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Customer & Details */}
                <div className="space-y-8">


                    {/* Payment History */}
                    {order.transactions && order.transactions.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                                    <span>🧾</span> Tahsilat Geçmişi
                                </h3>
                            </div>
                            <div className="p-4 space-y-2">
                                {order.transactions.filter((t: any) => t.metadata?.auto_processed || t.description?.includes('Tahsilat') || t.description?.includes('Ödeme')).map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(t.date).toLocaleDateString('tr-TR')}</div>
                                            <div className="text-xs font-bold text-gray-700 mt-0.5">{t.description}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-gray-900">+{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                                            <div className="text-[9px] font-medium text-gray-400">{t.metadata?.method?.toUpperCase() || 'EFT'}</div>
                                        </div>
                                    </div>
                                ))}

                                <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Ödeme Durumu</span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`font-black text-[10px] uppercase ${paymentStatus === 'paid' ? 'text-green-600' : paymentStatus === 'partial' ? 'text-amber-600' : 'text-red-600'}`}>
                                                {paymentStatus === 'paid' ? 'Ödendi' : paymentStatus === 'partial' ? 'Kısmi Ödendi' : 'Ödeme Bekliyor'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-gray-400">Tahsil Edilen</span>
                                            <span className="text-gray-900">{order.paid_amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / {order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${paymentStatus === 'paid' ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min(100, (order.paid_amount / order.total) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {paymentStatus !== 'paid' && (
                                    <button
                                        onClick={handlePaymentUpdate}
                                        disabled={loading}
                                        className="w-full mt-4 py-3 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'İşleniyor...' : '💳 Kalan Bakiyeyi Kapat'}
                                    </button>
                                )}

                            </div>
                        </div>
                    )}



                    {/* Customer Info */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                                <span>👤</span> Müşteri Bilgileri
                            </h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center text-2xl">👤</div>
                                <div>
                                    <Link href={`/admin/accounting/customers/${order.contacts?.id}`} className="text-lg font-black text-gray-900 leading-tight">
                                        {order.contacts?.first_name} {order.contacts?.last_name}
                                    </Link>
                                    <div className="text-sm font-medium text-indigo-600 mt-0.5">{order.contacts?.company_name}</div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">E-Posta</span>
                                    <span className="text-gray-900 font-medium">{order.contacts?.email || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Telefon</span>
                                    <span className="text-gray-900 font-medium">{order.contacts?.phone || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start text-sm pt-2">
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Adres</span>
                                    <span className="text-gray-900 font-medium text-right max-w-[150px]">{order.contacts?.address || '-'}</span>
                                </div>
                            </div>

                            <a
                                href={`/admin/accounting/customers/${order.contact_id}`}
                                className="block w-full text-center py-4 bg-gray-50 text-gray-600 font-black text-xs rounded-2xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
                            >
                                Müşteri Kartını Görüntüle
                            </a>
                        </div>
                    </div>

                    {/* Logistics Info */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                                <span>🏢</span> Lojistik Detaylar
                            </h3>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Çıkış Deposu</span>
                                <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-700">{order.warehouses?.key || 'Ana Depo'}</span>
                            </div>


                        </div>
                    </div>



                </div>
            </div>
        </div>
    );
}
