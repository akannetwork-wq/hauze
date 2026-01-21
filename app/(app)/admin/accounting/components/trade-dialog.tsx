'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/app/actions/inventory';
import { processTradeAction, quickCreateProduct } from '@/app/actions/bridge';
import { getInventory } from '@/app/actions/commerce';
import { toast } from 'react-hot-toast';
import Portal from '@/components/ui/portal';

interface Props {
    contact: any;
    type: 'sale' | 'purchase';
    onClose: () => void;
    onSuccess: () => void;
}

export default function TradeDialog({ contact, type, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [inventory, setInventory] = useState<Record<string, any>>({});

    const [items, setItems] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [description, setDescription] = useState('');
    const [quickType, setQuickType] = useState<'product' | 'consumable'>('product');
    const [quickSellable, setQuickSellable] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'eft' | 'cash' | 'credit_card' | 'check'>('eft');

    useEffect(() => {
        async function loadInitial() {
            const [p, inv] = await Promise.all([
                getProducts({
                    allowSale: type === 'sale' ? true : undefined,
                    status: 'active'
                }),
                getInventory()
            ]);
            setProducts(p);
            setInventory(inv);
        }
        loadInitial();
    }, [type]);

    const addItem = (product: any) => {
        if (items.find(i => i.productId === product.id)) {
            toast.error('Bu ürün zaten ekli.');
            return;
        }

        // Stock Check for Sales
        if (type === 'sale') {
            const stockLevel = inventory[product.sku.toUpperCase()]?.state?.on_hand;
            // If stockLevel is strictly defined and 0 or less, we block
            // If it's undefined, it's considered unlimited (user's request)
            if (stockLevel !== undefined && stockLevel <= 0) {
                toast.error('Bu ürünün stoğu kalmamış.');
                return;
            }
        }

        // Find price logic (consistent with search display)
        const targetListKey = type === 'purchase' ? 'purchase' : 'standard';
        const foundPrice = product.prices?.find((px: any) => px.list_key === targetListKey && px.currency === 'TRY')?.amount
            || product.prices?.find((px: any) => px.list_key === targetListKey)?.amount
            || product.prices?.find((px: any) => px.list_key === 'standard' && px.currency === 'TRY')?.amount
            || product.prices?.find((px: any) => px.list_key === 'standard')?.amount
            || 0;

        setItems([...items, {
            productId: product.id,
            sku: product.sku,
            title: product.title,
            quantity: 1,
            price: foundPrice
        }]);
        setSearch('');
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];

        if (field === 'quantity' && type === 'sale') {
            const item = newItems[index];
            const stockLevel = inventory[item.sku.toUpperCase()]?.state?.on_hand;
            if (stockLevel !== undefined && value > stockLevel) {
                toast.error(`Yetersiz stok! Maksimum: ${stockLevel}`);
                return;
            }
        }

        newItems[index][field] = value;
        setItems(newItems);
    };

    const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const handleSubmit = async (orderStatus?: 'pending' | 'delivered') => {
        if (items.length === 0) {
            toast.error('Lütfen en az bir ürün ekleyin.');
            return;
        }

        setLoading(true);
        try {
            const result = await processTradeAction({
                type,
                contactId: contact.id,
                items,
                total,
                currency: 'TRY', // Default for now
                description,
                paymentMethod,
                status: orderStatus
            });

            if (result.success) {
                toast.success(type === 'sale' ? 'Satış kaydedildi.' : 'Alım kaydedildi.');
                onSuccess();
                onClose();
            } else {
                toast.error('İşlem başarısız: ' + result.error);
            }
        } catch (error) {
            toast.error('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickCreate = async () => {
        const sku = 'NEW-' + Math.random().toString(36).substring(7).toUpperCase();
        const res = await quickCreateProduct({
            title: search,
            sku,
            base_price: 0,
            flowType: type,
            type: quickType,
            allow_sale: quickType === 'product' ? true : quickSellable
        });
        if (res.success) {
            addItem(res.data);
            setProducts([...products, res.data]);
            setSearch('');
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase())) &&
            !items.find(i => i.productId === p.id);

        if (!matchesSearch) return false;

        // Sales Filter: Hide out of stock items
        if (type === 'sale') {
            const stockLevel = inventory[p.sku.toUpperCase()]?.state?.on_hand;
            if (stockLevel !== undefined && stockLevel <= 0) return false;
        }

        return true;
    }).slice(0, 5);

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {type === 'sale' ? '🎯 Yeni Satış' : '📦 Yeni Satın Alma'}
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">{contact.company_name || `${contact.first_name} ${contact.last_name}`}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Product Search */}
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 mb-2 block">Ürün Ekle</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Ürün adı veya SKU ara..."
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm shadow-inner"
                                    />
                                </div>

                                {search && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                                        {filteredProducts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addItem(p)}
                                                className="w-full px-6 py-4 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors border-b last:border-0"
                                            >
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{p.title}</div>
                                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{p.sku}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-indigo-500">
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
                                                            .format(p.prices?.find((px: any) => px.list_key === (type === 'purchase' ? 'purchase' : 'standard') && px.currency === 'TRY')?.amount
                                                                || p.prices?.find((px: any) => px.list_key === (type === 'purchase' ? 'purchase' : 'standard'))?.amount
                                                                || p.prices?.find((px: any) => px.list_key === 'standard' && px.currency === 'TRY')?.amount
                                                                || p.prices?.find((px: any) => px.list_key === 'standard')?.amount
                                                                || 0)}
                                                    </div>
                                                    {inventory[p.sku.toUpperCase()]?.state?.on_hand !== undefined && (
                                                        <div className={`text-[10px] font-black uppercase mt-0.5 ${inventory[p.sku.toUpperCase()].state.on_hand > 5 ? 'text-gray-400' : 'text-amber-500'}`}>
                                                            📦 Stok: {inventory[p.sku.toUpperCase()].state.on_hand}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <div className="p-8 bg-gray-50/50">
                                                {type === 'purchase' ? (
                                                    <div className="space-y-4 max-w-sm mx-auto bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
                                                        <div className="text-center">
                                                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Yeni Kayıt Türü</div>
                                                            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                                                                <button
                                                                    onClick={() => setQuickType('product')}
                                                                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${quickType === 'product' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}
                                                                >📦 Ürün</button>
                                                                <button
                                                                    onClick={() => setQuickType('consumable')}
                                                                    className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${quickType === 'consumable' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-500'}`}
                                                                >🏗️ Sarf</button>
                                                            </div>
                                                        </div>

                                                        {quickType === 'consumable' && (
                                                            <label className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-amber-50 rounded-xl transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={quickSellable}
                                                                    onChange={(e) => setQuickSellable(e.target.checked)}
                                                                    className="rounded border-gray-300 text-amber-600 w-4 h-4 focus:ring-amber-500"
                                                                />
                                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-amber-700 transition-colors">Bu Malzemeyi Satabiliyoruz</span>
                                                            </label>
                                                        )}

                                                        <button
                                                            onClick={handleQuickCreate}
                                                            className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all hover:-translate-y-1 ${quickType === 'consumable' ? 'bg-amber-600 shadow-amber-200 hover:bg-amber-700' : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'
                                                                }`}
                                                        >
                                                            ✨ {quickType === 'product' ? 'Ürün' : 'Sarf Malzeme'} Olarak Ekle
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 text-sm flex items-center justify-center gap-2 italic">
                                                        <span>🔍</span> Katalogda bu isimde ürün bulunamadı.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 block">Sepet Detayı</label>
                            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Ürün</th>
                                            <th className="px-6 py-4 w-32">Miktar</th>
                                            <th className="px-6 py-4 w-40 text-right">Birim Fiyat</th>
                                            <th className="px-6 py-4 w-40 text-right">Toplam</th>
                                            <th className="px-6 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{item.title}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 font-mono italic">{item.sku}</span>
                                                        {type === 'sale' && inventory[item.sku.toUpperCase()]?.state?.on_hand !== undefined && (
                                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                                                                📦 {inventory[item.sku.toUpperCase()].state.on_hand} Stok
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                                                            className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                                                        />
                                                        <span className="text-xs text-gray-400">TL</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-gray-900">
                                                    {(item.quantity * item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-2">✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm italic">Sepet boş. Ürün arayarak eklemeye başlayın.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 block">Ödeme Yöntemi</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'eft', name: 'EFT / Havale', icon: '🏦' },
                                        { id: 'cash', name: 'Nakit', icon: '💵' },
                                        { id: 'credit_card', name: 'Kredi Kartı', icon: '💳' },
                                        { id: 'check', name: 'Çek', icon: '📝' },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setPaymentMethod(m.id as any)}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-sm font-bold ${paymentMethod === m.id
                                                ? (type === 'sale' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-emerald-600 bg-emerald-50 text-emerald-600')
                                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <span className="text-xl">{m.icon}</span>
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 italic px-1">
                                    {paymentMethod === 'eft'
                                        ? '* Cari hesap borç/alacak olarak kaydedilir, ödeme bekler.'
                                        : '* İşlem tutarı kadar otomatik tahsilat/tediye işlenir, bakiye kapatılır.'}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 block">İşlem Notu</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm min-h-[116px]"
                                    placeholder="Opsiyonel açıklama..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Genel Toplam</div>
                            <div className="text-3xl font-black text-gray-900">
                                {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-gray-400 uppercase">TRY</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200"
                            >
                                Vazgeç
                            </button>

                            {type === 'sale' ? (
                                <>
                                    <button
                                        onClick={() => handleSubmit('pending')}
                                        disabled={loading || items.length === 0}
                                        className={`px-8 py-4 rounded-2xl font-black text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all ${loading || items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'
                                            }`}
                                    >
                                        Sipariş Oluştur
                                    </button>
                                    <button
                                        onClick={() => handleSubmit('delivered')}
                                        disabled={loading || items.length === 0}
                                        className={`px-10 py-4 rounded-2xl font-black text-white shadow-xl shadow-indigo-200 transition-all ${loading || items.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1'
                                            }`}
                                    >
                                        {loading ? 'Kaydediliyor...' : 'Hemen Teslim'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={loading || items.length === 0}
                                    className={`px-12 py-4 rounded-2xl font-black text-white shadow-xl shadow-emerald-200 transition-all ${loading || items.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1'
                                        }`}
                                >
                                    {loading ? 'Kaydediliyor...' : 'Alımı Tamamla'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
