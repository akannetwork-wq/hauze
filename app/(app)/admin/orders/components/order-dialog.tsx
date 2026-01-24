'use client';

import React, { useState, useEffect } from 'react';
import { updateOrderStatus, registerOrderPayment, getOrder } from '@/app/actions/orders';
import { getFinanceAccounts } from '@/app/actions/finance';
import OrderStatusBadge from './order-status-badge';
import { toast } from 'react-hot-toast';
import Drawer from '@/components/admin/ui/drawer';
import { useRouter, usePathname } from 'next/navigation';
import { UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface Props {
    orderId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function OrderDialog({ orderId, onClose, onSuccess }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const isWmsContext = pathname?.includes('/admin/wms');

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Payment State
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'eft' | 'cash' | 'credit_card' | 'check'>('eft');
    const [checkDetails, setCheckDetails] = useState({ bankName: '', serialNumber: '', dueDate: '' });

    // V2: Account Selection
    const [financeAccounts, setFinanceAccounts] = useState<any[]>([]);
    const [targetAccountId, setTargetAccountId] = useState('');

    // WMS Shipping State
    const [shippingDetails, setShippingDetails] = useState({ carrier: '', trackingNumber: '' });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [orderData, accounts] = await Promise.all([
                getOrder(orderId),
                getFinanceAccounts()
            ]);

            setOrder(orderData);
            setFinanceAccounts(accounts);

            // Set default payment amount to remaining
            if (orderData) {
                const remaining = (orderData.total || 0) - (orderData.paid_amount || 0);
                setPaymentAmount(remaining > 0 ? remaining : 0);
            }

            setLoading(false);
        }
        loadData();
    }, [orderId]);

    const handleOpenContact = () => {
        onClose();
        if (order.employees) {
            router.push(`/admin/personnel`);
        } else {
            router.push(`/admin/accounting/${order.type === 'sale' ? 'customers' : 'suppliers'}?drawer=contact-detail&id=${order.contact_id}`);
        }
    };

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

    const handleWmsShipAction = async () => {
        setActionLoading(true);
        const { processWmsAction } = await import('@/app/actions/wms');
        const res = await processWmsAction(order.id, 'ship', {
            carrier: shippingDetails.carrier,
            trackingNumber: shippingDetails.trackingNumber
        });

        if (res.success) {
            const updatedOrder = await getOrder(orderId);
            setOrder(updatedOrder);
            toast.success('Sevkiyat başarıyla kaydedildi.');
            onSuccess?.();
        } else {
            toast.error('Hata: ' + res.error);
        }
        setActionLoading(false);
    };

    const handlePaymentUpdate = async () => {
        if (!targetAccountId) {
            toast.error('Lütfen ödemenin yapılacağı Kasa/Banka seçiniz.');
            return;
        }

        if (!confirm(`${paymentAmount.toLocaleString('tr-TR')} TL tutarında tahsilat kaydetmek istediğinize emin misiniz?`)) return;

        setActionLoading(true);
        const res = await registerOrderPayment(order.id, paymentAmount, paymentMethod, targetAccountId, paymentMethod === 'check' ? checkDetails : undefined);
        if (res.success) {
            const updatedOrder = await getOrder(orderId);
            setOrder(updatedOrder);

            // Update next payment amount
            const remaining = (updatedOrder.total || 0) - (updatedOrder.paid_amount || 0);
            setPaymentAmount(remaining);

            toast.success('Ödeme başarıyla kaydedildi.');
            onSuccess?.();
        } else {
            toast.error('Hata: ' + res.error);
        }
        setActionLoading(false);
    };

    const handleDeductSalary = async () => {
        if (!confirm('Bu sipariş tutarını personelin hakedişinden (Maaşından) düşmek istediğinize emin misiniz? Bu işlem finansal bir para girişi yaratmaz, sadece borcu siler.')) return;

        setActionLoading(true);
        const { deductOrderFromSalary } = await import('@/app/actions/orders');
        const res = await deductOrderFromSalary(order.id);

        if (res.success) {
            const updatedOrder = await getOrder(orderId);
            setOrder(updatedOrder);
            setPaymentAmount(0); // Paid fully
            toast.success('Sipariş tutarı maaştan düşüldü ve kapatıldı.');
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

                    {/* Customer/Personnel Info Card */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group" onClick={handleOpenContact}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                {order.contacts?.company_name ? <BuildingOfficeIcon className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {order.employees ? 'Personel' : 'Müşteri'}
                                </div>
                                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {order.employees
                                        ? `${order.employees.first_name} ${order.employees.last_name}`
                                        : (order.contacts?.company_name || `${order.contacts?.first_name} ${order.contacts?.last_name || ''}`)}
                                </div>
                            </div>
                        </div>
                        {!isWmsContext && (
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                →
                            </div>
                        )}
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
                                        {!isWmsContext && <th className="px-5 py-4 text-right">Toplam</th>}
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
                                            {!isWmsContext && (
                                                <td className="px-5 py-4 text-right font-black text-gray-900 whitespace-nowrap">
                                                    {(line.quantity * line.price).toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                {!isWmsContext && (
                                    <tfoot className="bg-gray-50/10 font-black">
                                        <tr>
                                            <td colSpan={2} className="px-5 py-5 text-right text-gray-400 uppercase text-[10px] tracking-widest">Genel Toplam</td>
                                            <td className="px-5 py-5 text-right text-lg text-indigo-600">
                                                {order.total?.toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
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
                    {!isWmsContext && (
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span>💳</span> Ödeme Bilgileri
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase">Ödeme Durumu</span>
                                    <span className={`text-[11px] font-black uppercase ${order.payment_status === 'paid' ? 'text-green-600' :
                                        order.payment_status === 'partial' ? 'text-amber-600' : 'text-red-600'}`}>
                                        {order.payment_status === 'paid' ? '🔥 Ödendi' :
                                            order.payment_status === 'partial' ? '⚠️ Kısmi Ödeme' : '⏳ Bekliyor'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-gray-400">Tahsil Edilen</span>
                                        <span className="text-gray-900">{order.paid_amount?.toLocaleString('tr-TR')} / {order.total?.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-50 border border-gray-100 rounded-full overflow-hidden p-0.5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min(100, (order.paid_amount / order.total) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {order.payment_status !== 'paid' && (
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ödeme Detayları</label>
                                            <div className="space-y-2 mt-2">
                                                {/* Amount & Method Row */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={paymentAmount}
                                                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all"
                                                        max={order.total - (order.paid_amount || 0)}
                                                        placeholder="Tutar"
                                                    />
                                                    <select
                                                        value={paymentMethod}
                                                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                                                        className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all"
                                                    >
                                                        <option value="eft">EFT</option>
                                                        <option value="cash">Nakit</option>
                                                        <option value="credit_card">Kart</option>
                                                        <option value="check">Çek</option>
                                                    </select>
                                                </div>

                                                {/* Target Account Selection */}
                                                <select
                                                    required
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500"
                                                    value={targetAccountId}
                                                    onChange={e => setTargetAccountId(e.target.value)}
                                                >
                                                    <option value="">
                                                        {paymentMethod === 'cash' ? 'Kasa Seçin...' :
                                                            paymentMethod === 'eft' ? 'Banka Seçin...' :
                                                                paymentMethod === 'check' ? 'Portföy Seçin...' :
                                                                    (order.type === 'purchase' ? 'Kredi Kartı Seçin...' : 'POS Seçin...')}
                                                    </option>
                                                    {financeAccounts
                                                        .filter(a => {
                                                            if (paymentMethod === 'cash') return a.type === 'safe';
                                                            if (paymentMethod === 'eft') return a.type === 'bank';
                                                            if (paymentMethod === 'credit_card') {
                                                                return order.type === 'purchase' ? a.type === 'credit_card' : a.type === 'pos';
                                                            }
                                                            if (paymentMethod === 'check') return a.type === 'check_portfolio';
                                                            return false;
                                                        })
                                                        .map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                            {paymentMethod === 'check' && (
                                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-2">
                                                    <div className="text-amber-800 text-[10px] font-bold uppercase tracking-widest">Çek Bilgileri</div>
                                                    <input
                                                        type="text" placeholder="Banka Adı"
                                                        value={checkDetails.bankName} onChange={e => setCheckDetails({ ...checkDetails, bankName: e.target.value })}
                                                        className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs outline-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text" placeholder="Seri No"
                                                            value={checkDetails.serialNumber} onChange={e => setCheckDetails({ ...checkDetails, serialNumber: e.target.value })}
                                                            className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs outline-none"
                                                        />
                                                        <input
                                                            type="date"
                                                            value={checkDetails.dueDate} onChange={e => setCheckDetails({ ...checkDetails, dueDate: e.target.value })}
                                                            className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {order.employees && (
                                                <button
                                                    onClick={handleDeductSalary}
                                                    disabled={actionLoading}
                                                    className="flex-1 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-black text-xs hover:bg-rose-100 transition-all disabled:opacity-50"
                                                >
                                                    📉 Maaştan Düş
                                                </button>
                                            )}
                                            <button
                                                onClick={handlePaymentUpdate}
                                                disabled={actionLoading || paymentAmount <= 0}
                                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
                                            >
                                                {actionLoading ? 'İşleniyor...' : '💳 Ödeme Al'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="bg-gray-900 rounded-3xl p-6 space-y-4 shadow-xl">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span>🛠️</span> Durum Yönetimi
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {order.status === 'pending' && (
                                <button
                                    onClick={() => handleStatusUpdate(order.type === 'purchase' ? 'delivered' : 'preparing')}
                                    disabled={actionLoading}
                                    className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all ${order.type === 'purchase' ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-900/40' : 'bg-white text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    {order.type === 'purchase' ? '📥 Teslim Alındı (Stok Girişi Yap)' : '📦 Hazırlamaya Başla'}
                                </button>
                            )}
                            {order.type === 'sale' && order.status === 'preparing' && (
                                <button
                                    onClick={() => handleStatusUpdate('ready')}
                                    disabled={actionLoading}
                                    className="w-full bg-indigo-500 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all"
                                >
                                    ✅ Hazır Olarak İşaretle
                                </button>
                            )}
                            {order.type === 'sale' && ['ready', 'preparing'].includes(order.status) && (
                                <button
                                    onClick={() => handleStatusUpdate('shipped')}
                                    disabled={actionLoading}
                                    className="w-full bg-blue-500 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all"
                                >
                                    🚚 Kargoya Ver
                                </button>
                            )}
                            {order.type === 'sale' && ['shipped', 'ready'].includes(order.status) && (
                                <div className="space-y-4">
                                    {isWmsContext && order.status === 'ready' && (
                                        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 space-y-3">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sevkiyat Bilgileri</div>
                                            <input
                                                type="text" placeholder="Kargo Firması / Araç"
                                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                value={shippingDetails.carrier} onChange={e => setShippingDetails({ ...shippingDetails, carrier: e.target.value })}
                                            />
                                            <input
                                                type="text" placeholder="Takip No / Plaka"
                                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-indigo-500"
                                                value={shippingDetails.trackingNumber} onChange={e => setShippingDetails({ ...shippingDetails, trackingNumber: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => isWmsContext ? handleWmsShipAction() : handleStatusUpdate('delivered')}
                                        disabled={actionLoading}
                                        className="w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all font-mono"
                                    >
                                        {isWmsContext
                                            ? (order.status === 'shipped' ? '🏠 Teslim Edildi' : '🚚 Sevkiyatı Başlat')
                                            : '🏠 Teslim Edildi'}
                                    </button>
                                </div>
                            )}
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <button
                                    onClick={() => handleStatusUpdate('cancelled')}
                                    disabled={actionLoading}
                                    className="w-full bg-red-900/50 text-red-100 py-3.5 rounded-2xl font-black text-xs hover:bg-red-900 transition-all mt-4 border border-red-800"
                                >
                                    ✕ İptal Et
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </Drawer>
    );
}

