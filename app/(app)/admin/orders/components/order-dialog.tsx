'use client';

import React, { useState, useEffect } from 'react';
import { updateOrderStatus, markOrderAsPaid, getOrder } from '@/app/actions/orders';
import OrderStatusBadge from './order-status-badge';
import { toast } from 'react-hot-toast';
import Drawer from '@/components/admin/ui/drawer';

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
            const updatedOrder = await getOrder(orderId);
            setOrder(updatedOrder);
            toast.success('Ödeme kaydedildi ve cari hesap kapatıldı.');
            onSuccess?.();
        } else {
            toast.error('Hata: ' + res.error);
        }
        setActionLoading(false);
    };

    return (
        <Drawer
            isOpen={true}
            onClose={onClose}
            title={order ? `Sipariş #${order.id.slice(0, 8).toUpperCase()}` : 'Yükleniyor...'}
            subtitle={order ? `${new Date(order.created_at).toLocaleString('tr-TR')} • ${order.type === 'sale' ? 'Satış Siparişi' : 'Alım Siparişi'}` : ''}
        >
            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            ) : order ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Status Badge */}
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mevcut Durum</span>
                        <OrderStatusBadge status={order.status} />
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="font-black text-gray-900 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                <span>🛒</span> Sipariş İçeriği
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <tr>
                                        <th className="px-5 py-4">Ürün</th>
                                        <th className="px-5 py-4 text-center">Miktar</th>
                                        <th className="px-5 py-4 text-right">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.lines?.map((line: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-gray-900 line-clamp-1">{line.title}</div>
                                                <div className="text-[10px] text-gray-400 font-mono italic">{line.sku}</div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="font-bold text-gray-900">{line.quantity}</span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-black text-gray-900 whitespace-nowrap">
                                                {(line.quantity * line.price).toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50/10 font-black">
                                    <tr>
                                        <td colSpan={2} className="px-5 py-5 text-right text-gray-400 uppercase text-[10px] tracking-widest">Genel Toplam</td>
                                        <td className="px-5 py-5 text-right text-lg text-indigo-600">
                                            {order.total.toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Description */}
                    {order.description && (
                        <div className="bg-amber-50/30 rounded-2xl border border-amber-100 p-5">
                            <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span>📝</span> Not
                            </h3>
                            <p className="text-gray-700 text-sm italic leading-relaxed">{order.description}</p>
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span>💳</span> Ödeme Bilgileri
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold text-gray-500 uppercase">Ödeme Durumu</span>
                                <span className={`text-[11px] font-black uppercase ${order.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.payment_status === 'paid' ? '🔥 Ödendi' : '⏳ Bekliyor'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-gray-400">Tahsil Edilen</span>
                                    <span className="text-gray-900">{order.paid_amount?.toLocaleString('tr-TR')} / {order.total.toLocaleString('tr-TR')} TL</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-50 border border-gray-100 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${Math.min(100, (order.paid_amount / order.total) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            {order.payment_status !== 'paid' && (
                                <button
                                    onClick={handlePaymentUpdate}
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl font-black text-xs hover:border-indigo-400 hover:bg-indigo-50 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? 'İşleniyor...' : '💰 Tüm Bakiyeyi Kapat'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-900 rounded-3xl p-6 space-y-4 shadow-xl">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span>🛠️</span> Durum Yönetimi
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {order.status === 'pending' && (
                                <button
                                    onClick={() => handleStatusUpdate('preparing')}
                                    disabled={actionLoading}
                                    className="w-full bg-white text-gray-900 py-3.5 rounded-2xl font-black text-xs hover:bg-gray-100 transition-all"
                                >
                                    📦 Hazırlamaya Başla
                                </button>
                            )}
                            {order.status === 'preparing' && (
                                <button
                                    onClick={() => handleStatusUpdate('ready')}
                                    disabled={actionLoading}
                                    className="w-full bg-indigo-500 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all"
                                >
                                    ✅ Hazır Olarak İşaretle
                                </button>
                            )}
                            {['ready', 'preparing'].includes(order.status) && (
                                <button
                                    onClick={() => handleStatusUpdate('shipped')}
                                    disabled={actionLoading}
                                    className="w-full bg-blue-500 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all"
                                >
                                    🚚 Kargoya Ver
                                </button>
                            )}
                            {['shipped', 'ready'].includes(order.status) && (
                                <button
                                    onClick={() => handleStatusUpdate('delivered')}
                                    disabled={actionLoading}
                                    className="w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all"
                                >
                                    🏠 Teslim Edildi
                                </button>
                            )}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <button
                                    onClick={() => handleStatusUpdate('cancelled')}
                                    disabled={actionLoading}
                                    className="w-full bg-red-900/50 text-red-100 py-3.5 rounded-2xl font-black text-xs hover:bg-red-900 transition-all mt-4 border border-red-800"
                                >
                                    ✕ Siparişi İptal Et
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </Drawer>
    );
}
