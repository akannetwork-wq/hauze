import React, { useState, useEffect } from 'react';
import Portal from '@/components/ui/portal';
import { addTransaction, getOpenOrders } from '@/app/actions/accounting';
import { toast } from 'react-hot-toast';

interface Props {
    contact: any;
    account: any;
    type: 'customer' | 'supplier';
    onClose: () => void;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { id: 'cash', name: 'Nakit', icon: '💵' },
    { id: 'credit_card', name: 'Kredi Kartı', icon: '💳' },
    { id: 'eft', name: 'EFT / Havale', icon: '🏦' },
    { id: 'check', name: 'Çek', icon: '📝' },
];

export default function PaymentDialog({ contact, account, type, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [openOrders, setOpenOrders] = useState<any[]>([]);
    const [form, setForm] = useState({
        amount: '',
        method: 'cash',
        date: new Date().toISOString().split('T')[0],
        description: '',
        orderId: ''
    });

    useEffect(() => {
        async function load() {
            const orders = await getOpenOrders(contact.id);
            setOpenOrders(orders);
        }
        load();
    }, [contact.id]);

    const isCustomer = type === 'customer';
    const actionTitle = isCustomer ? 'Ödeme Al (Tahsilat)' : 'Ödeme Yap (Tediye)';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            toast.error('Lütfen geçerli bir tutar girin.');
            return;
        }

        if (!account?.id) {
            toast.error('Bu kişi için tanımlı bir hesap bulunamadı.');
            return;
        }

        setLoading(true);
        try {
            const res = await addTransaction({
                account_id: account.id,
                type: isCustomer ? 'credit' : 'debit',
                amount: Number(form.amount),
                date: form.date,
                description: `${PAYMENT_METHODS.find(m => m.id === form.method)?.name} - ${form.description || (isCustomer ? 'Tahsilat' : 'Ödeme')}`,
                document_type: 'payment',
                document_id: form.orderId || null,
                metadata: { method: form.method }
            });

            if (res.success) {
                toast.success('İşlem başarıyla kaydedildi.');
                onSuccess();
                setTimeout(() => onClose(), 500);
            } else {
                toast.error(res.error || 'Bir hata oluştu.');
            }
        } catch (error) {
            toast.error('Beklenmedik bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

                <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className={`p-8 ${isCustomer ? 'bg-indigo-600' : 'bg-emerald-600'} text-white`}>
                        <h2 className="text-2xl font-black tracking-tight">{actionTitle}</h2>
                        <p className="opacity-80 text-sm mt-1">{contact.company_name || `${contact.first_name} ${contact.last_name}`}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                        {openOrders.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">İlişkili Sipariş (Opsiyonel)</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    value={form.orderId}
                                    onChange={e => {
                                        const order = openOrders.find(o => o.id === e.target.value);
                                        setForm({
                                            ...form,
                                            orderId: e.target.value,
                                            amount: order ? (Number(order.total) - Number(order.paid_amount)).toString() : form.amount
                                        });
                                    }}
                                >
                                    <option value="">Genel Ödeme (Sipariş Bağımsız)</option>
                                    {openOrders.map(o => (
                                        <option key={o.id} value={o.id}>
                                            #{o.id.slice(0, 8).toUpperCase()} - {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(o.total) - Number(o.paid_amount))} Kalan
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tutar (TL)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-2xl font-black text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-200"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ödeme Yöntemi</label>
                            <div className="grid grid-cols-2 gap-3">
                                {PAYMENT_METHODS.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setForm({ ...form, method: m.id })}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-sm font-bold ${form.method === m.id
                                            ? (isCustomer ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-emerald-600 bg-emerald-50 text-emerald-600')
                                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <span className="text-xl">{m.icon}</span>
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tarih</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Açıklama (Opsiyonel)</label>
                                <textarea
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px] resize-none"
                                    placeholder="İşlem ile ilgili not..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all text-sm"
                            >
                                İptal
                            </button>
                            <button
                                disabled={loading}
                                type="submit"
                                className={`flex-[2] px-6 py-4 rounded-2xl font-black text-white shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 text-sm ${isCustomer ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'
                                    }`}
                            >
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Portal>
    );
}
