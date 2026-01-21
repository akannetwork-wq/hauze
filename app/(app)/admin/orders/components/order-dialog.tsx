'use client';

import React, { useState, useEffect } from 'react';
import { updateOrderStatus, markOrderAsPaid, getOrder } from '@/app/actions/orders';
import OrderStatusBadge from './order-status-badge';
import { toast } from 'react-hot-toast';
import Portal from '@/components/ui/portal';

interface Props {
    orderId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function OrderDialog({ orderId, onClose, onSuccess }: Props) {
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        async function loadOrder() {
            setLoading(true);
            const data = await getOrder(orderId);
            setOrder(data);
            setLoading(false);
        }
        loadOrder();
    }, [orderId]);

    const handleStatusUpdate = async (newStatus: string) => {
        setActionLoading(true);
        const res = await updateOrderStatus(order.id, newStatus);
        if (res.success) {
            setOrder({ ...order, status: newStatus });
            toast.success('Sipariş durumu güncellendi.');
            onSuccess?.();
        } else {
            toast.error('Hata: ' + res.error);
        }
        setActionLoading(false);
    };

    const handlePaymentUpdate = async () => {
        if (!confirm('Bu siparişi ödendi olarak işaretlemek ve cari hesaba tahsilat işlemek istediğinize emin misiniz?')) return;

        setActionLoading(true);
        const res = await markOrderAsPaid(order.id, 'eft');
        if (res.success) {
            // Re-load order to get updated transaction history and status
            const updatedOrder = await getOrder(orderId);
            setOrder(updatedOrder);
            toast.success('Ödeme kaydedildi ve cari hesap kapatıldı.');
            onSuccess?.();
        } else {
            toast.error('Hata: ' + res.error);
        }
        setActionLoading(false);
    };

    if (loading) {
        return (
            <Portal>
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[80vh] flex items-center justify-center shadow-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                    </div>
                </div>
            </Portal>
        );
    }

    if (!order) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    Sipariş #{order.id.slice(0, 8).toUpperCase()}
                                </h2>
                                <OrderStatusBadge status={order.status} />
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                                {new Date(order.created_at).toLocaleString('tr-TR')} • {order.type === 'sale' ? 'Satış Siparişi' : 'Alım Siparişi'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Items */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                                        <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                            <span>🛒</span> Sipariş İçeriği
                                        </h3>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                            <tr>
                                                <th className="px-6 py-4">Ürün</th>
                                                <th className="px-6 py-4 text-center">Miktar</th>
                                                <th className="px-6 py-4 text-right">Toplam</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {order.lines?.map((line: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900">{line.title}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono">{line.sku}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-bold text-gray-900">{line.quantity}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-gray-900">
                                                        {(line.quantity * line.price).toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50/30 font-black">
                                            <tr>
                                                <td colSpan={2} className="px-6 py-4 text-right text-gray-500 uppercase text-[10px] tracking-widest">Genel Toplam</td>
                                                <td className="px-6 py-4 text-right text-xl text-indigo-600">
                                                    {order.total.toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {order.description && (
                                    <div className="bg-white rounded-3xl border border-gray-100 p-6">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <span>📝</span> Not
                                        </h3>
                                        <p className="text-gray-700 text-sm italic">{order.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Status & Payment */}
                            <div className="space-y-6">
                                {/* Workflow Actions */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span>🛠️</span> İşlemler
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate('preparing')}
                                                disabled={actionLoading}
                                                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all disabled:opacity-50"
                                            >
                                                📦 Hazırlamaya Başla
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusUpdate('ready')}
                                                disabled={actionLoading}
                                                className="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-blue-700 transition-all disabled:opacity-50"
                                            >
                                                ✅ Hazır
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusUpdate('shipped')}
                                                disabled={actionLoading}
                                                className="w-full bg-purple-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-purple-700 transition-all disabled:opacity-50"
                                            >
                                                🚚 Kargolandı
                                            </button>
                                        )}
                                        {(order.status === 'shipped' || order.status === 'completed') && (
                                            <button
                                                onClick={() => handleStatusUpdate('delivered')}
                                                disabled={actionLoading}
                                                className="w-full bg-green-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-green-700 transition-all disabled:opacity-50"
                                            >
                                                🏠 Teslim Edildi
                                            </button>
                                        )}
                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleStatusUpdate('cancelled')}
                                                disabled={actionLoading}
                                                className="w-full bg-white border border-red-100 text-red-600 py-3 rounded-2xl font-black text-xs hover:bg-red-50 transition-all disabled:opacity-50"
                                            >
                                                ✕ İptal Et
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Status */}
                                <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span>💳</span> Ödeme Durumu
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Durum</span>
                                            <span className={`text-[10px] font-black uppercase ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'partial' ? 'text-amber-600' : 'text-red-600'}`}>
                                                {order.payment_status === 'paid' ? 'Ödendi' : order.payment_status === 'partial' ? 'Kısmi' : 'Bekliyor'}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-gray-400">Tahsil Edilen</span>
                                                <span className="text-gray-900">{order.paid_amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / {order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${Math.min(100, (order.paid_amount / order.total) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        {order.payment_status !== 'paid' && (
                                            <button
                                                onClick={handlePaymentUpdate}
                                                disabled={actionLoading}
                                                className="w-full py-3 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
                                            >
                                                {actionLoading ? 'İşleniyor...' : '💳 Bakiyeyi Kapat'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Transaction Mini History */}
                                {order.transactions && order.transactions.length > 0 && (
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                                            <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest">Tahsilat Geçmişi</h3>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {order.transactions.filter((t: any) => t.metadata?.auto_processed || t.description?.includes('Tahsilat') || t.description?.includes('Ödeme')).map((t: any) => (
                                                <div key={t.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center text-[11px]">
                                                    <div>
                                                        <div className="font-bold text-gray-700">{new Date(t.date).toLocaleDateString('tr-TR')}</div>
                                                        <div className="text-gray-400">{t.metadata?.method?.toUpperCase() || 'EFT'}</div>
                                                    </div>
                                                    <div className="text-right font-black text-indigo-600">
                                                        +{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-gray-900 transition-all bg-white border border-gray-200 shadow-sm"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
