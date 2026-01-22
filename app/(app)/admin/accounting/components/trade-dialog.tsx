'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/app/actions/inventory';
import { processTradeAction, quickCreateProduct } from '@/app/actions/bridge';
import { getInventory } from '@/app/actions/commerce';
import { toast } from 'react-hot-toast';
import Drawer from '@/components/admin/ui/drawer';

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

        if (type === 'sale') {
            const stockLevel = inventory[product.sku.toUpperCase()]?.state?.on_hand;
            if (stockLevel !== undefined && stockLevel <= 0) {
                toast.error('Bu ürünün stoğu kalmamış.');
                return;
            }
        }

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
                currency: 'TRY',
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
        if (type === 'sale') {
            const stockLevel = inventory[p.sku.toUpperCase()]?.state?.on_hand;
            if (stockLevel !== undefined && stockLevel <= 0) return false;
        }
        return true;
    }).slice(0, 5);

    return (
        <Drawer
            isOpen={true}
            onClose={onClose}
            title={type === 'sale' ? '🎯 Yeni Satış' : '📦 Yeni Satın Alma'}
            subtitle={contact.company_name || `${contact.first_name} ${contact.last_name}`}
        >
            <div className="space-y-8 animate-in fade-in duration-300">
                {/* Product Search */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ürün Ekle</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Ürün adı veya SKU ara..."
                            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm shadow-inner"
                        />

                        {search && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[110] overflow-hidden">
                                {filteredProducts.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addItem(p)}
                                        className="w-full px-6 py-4 text-left hover:bg-indigo-50 flex items-center justify-between group transition-colors border-b last:border-0"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{p.title}</div>
                                            <div className="text-[10px] text-gray-400 font-mono italic mt-0.5">{p.sku}</div>
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
                                {filteredProducts.length === 0 && type === 'purchase' && (
                                    <div className="p-6 bg-gray-50/50">
                                        <div className="space-y-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xl">
                                            <div className="text-center">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hızlı Kayıt</div>
                                                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-100">
                                                    <button
                                                        onClick={() => setQuickType('product')}
                                                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${quickType === 'product' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500'}`}
                                                    >📦 Ürün</button>
                                                    <button
                                                        onClick={() => setQuickType('consumable')}
                                                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${quickType === 'consumable' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-500'}`}
                                                    >🏗️ Sarf</button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleQuickCreate}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg"
                                            >
                                                ✨ Katalog'a Ekle ve Sepet'e At
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 block">Sipariş Satırları</label>
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-4">Ürün</th>
                                    <th className="px-5 py-4 w-24 text-center">Mik.</th>
                                    <th className="px-5 py-4 w-32 text-right">Fiyat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-gray-900 line-clamp-1">{item.title}</div>
                                            <div className="text-[10px] text-gray-400 font-mono italic">{item.sku}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                className="w-full bg-gray-50 border-none rounded-xl px-2 py-2 text-sm font-black text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-5 py-4">
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                                                className="w-full bg-gray-50 border-none rounded-xl px-2 py-2 text-sm font-black text-right outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals & Notes */}
                <div className="bg-gray-900 rounded-3xl p-6 space-y-6 shadow-xl">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Genel Toplam</div>
                            <div className="text-3xl font-black text-white">
                                {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-medium opacity-40">TRY</span>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ödeme</div>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                className="bg-transparent border-none text-white text-sm font-black outline-none cursor-pointer"
                            >
                                <option value="eft" className="bg-gray-800">EFT / Havale</option>
                                <option value="cash" className="bg-gray-800">Nakit</option>
                                <option value="credit_card" className="bg-gray-800">Kredi Kartı</option>
                                <option value="check" className="bg-gray-800">Çek</option>
                            </select>
                        </div>
                    </div>

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="İşlem notu (Opsiyonel)..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-all min-h-[80px]"
                    />

                    <div className="grid grid-cols-1 gap-3">
                        {type === 'sale' ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSubmit('pending')}
                                    disabled={loading || items.length === 0}
                                    className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black text-xs hover:bg-white/15 transition-all disabled:opacity-50"
                                >
                                    🛍️ Sipariş Oluştur
                                </button>
                                <button
                                    onClick={() => handleSubmit('delivered')}
                                    disabled={loading || items.length === 0}
                                    className="flex-[1.5] bg-indigo-500 text-white py-4 rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50"
                                >
                                    {loading ? 'İşleniyor...' : '⚡ Hemen Satış'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleSubmit()}
                                disabled={loading || items.length === 0}
                                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                            >
                                {loading ? 'İşleniyor...' : '📥 Alımı Tamamla'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
