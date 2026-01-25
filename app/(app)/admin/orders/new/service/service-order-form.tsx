'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createServiceOrder } from '@/app/actions/orders';
import { searchEntities } from '@/app/actions/accounting';
import { getFinanceAccounts } from '@/app/actions/finance';
import { Product } from '@/types';
import {
    UserIcon,
    WrenchScrewdriverIcon,
    CalculatorIcon,
    ShoppingCartIcon,
    TrashIcon,
    CheckCircleIcon,
    PlusIcon
} from '@heroicons/react/24/solid';

interface Props {
    services: Product[];
}

export default function ServiceOrderForm({ services }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Step 1: Contact Selection
    const [contactSearch, setContactSearch] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useState<any>(null);

    // Step 2: Cart management
    const [cart, setCart] = useState<any[]>([]);

    // Step 3: Current service being configured
    const [activeService, setActiveService] = useState<Product | null>(null);
    const [activeValues, setActiveValues] = useState<Record<string, any>>({});
    const [totalPrice, setTotalPrice] = useState(0);
    const [notes, setNotes] = useState('');

    // Payment State
    const [financeAccounts, setFinanceAccounts] = useState<any[]>([]);
    const [isPaid, setIsPaid] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'eft' | 'cash' | 'credit_card' | 'check'>('eft');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [checkDetails, setCheckDetails] = useState({ bankName: '', serialNumber: '', dueDate: '' });

    // Reactive Price Calculation
    useEffect(() => {
        if (activeService) {
            const price = calculateServicePrice(activeService, activeValues);
            setTotalPrice(price);
        } else {
            setTotalPrice(0);
        }
    }, [activeService, activeValues]);

    // Load Finance Accounts
    useEffect(() => {
        async function loadAccs() {
            try {
                const accs = await getFinanceAccounts();
                setFinanceAccounts(accs);
            } catch (err) {
                console.error("Error loading accounts", err);
            }
        }
        loadAccs();
    }, []);

    // Auto-select first account when method or account list changes
    useEffect(() => {
        if (isPaid && paymentMethod !== 'check' && financeAccounts.length > 0) {
            const relevantAccounts = financeAccounts.filter(a => {
                if (paymentMethod === 'cash') return a.type === 'safe';
                if (paymentMethod === 'eft') return a.type === 'bank';
                if (paymentMethod === 'credit_card') return a.type === 'pos';
                return false;
            });

            if (relevantAccounts.length > 0 && !selectedAccountId) {
                setSelectedAccountId(relevantAccounts[0].id);
            }
        }
    }, [isPaid, paymentMethod, financeAccounts, selectedAccountId]);

    // Debounced Contact Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (contactSearch.length > 1) {
                const results = await searchEntities(contactSearch);
                setContacts(results);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [contactSearch]);

    const getBasePrice = (service: Product) => {
        if (!service) return 0;

        // 1. Try plural 'prices' array (Standard TRY first)
        const prices = service.prices || [];
        const stdPrice = prices.find(p => p.list_key === 'standard' && p.currency === 'TRY')
            || prices.find(p => p.list_key === 'standard')
            || prices[0];

        if (stdPrice) {
            const amount = Number(stdPrice.amount);
            if (!isNaN(amount)) return amount;
        }

        // 2. Try singular 'price' property (Object or Number)
        const p = service.price as any;
        if (typeof p === 'number') return p;
        if (p?.amount) return Number(p.amount) || 0;

        return 0;
    };

    const calculateServicePrice = (service: Product, values: Record<string, any>) => {
        const basePrice = getBasePrice(service);
        let total = basePrice;

        const config = service.service_config;
        if (config?.rules) {
            config.rules.forEach(rule => {
                const val = values[rule.fieldId];
                if (val === undefined || val === null) return;

                const input = config.inputs?.find(i => i.id === rule.fieldId);
                const inputType = input?.type || 'number';

                // Condition check (matchValue)
                if ((rule as any).matchValue && String(val) !== String((rule as any).matchValue)) return;

                const numVal = Number(val);
                const isValActive = inputType === 'toggle'
                    ? (val === true || val === 'true')
                    : (val !== '' && val !== '0' && val !== 0 && val !== false && val !== 'false');

                if (rule.operation === 'add') {
                    if (!isNaN(numVal) && numVal !== 0) {
                        total += (numVal * (rule.value || 0));
                    }
                } else if (rule.operation === 'fixed_add') {
                    if (isValActive) {
                        total += (rule.value || 0);
                    }
                } else if (rule.operation === 'multiply') {
                    if (isValActive) {
                        const multiplier = Number(rule.value);
                        if (!isNaN(multiplier) && multiplier > 0) {
                            // If it's a number field, scale the multiplier by the quantity
                            const effect = inputType === 'number' ? (multiplier * numVal) : multiplier;
                            total = total * effect;
                        }
                    }
                }
            });
        }

        return isNaN(total) ? basePrice : total;
    };

    const addToCart = () => {
        if (!activeService) return;

        const cartItem = {
            id: Math.random().toString(36).substr(2, 9),
            productId: activeService.id,
            title: activeService.title,
            sku: activeService.sku,
            price: totalPrice,
            values: { ...activeValues }
        };

        setCart([...cart, cartItem]);
        setActiveService(null);
        setActiveValues({});
        setTotalPrice(0);
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

    const handleSubmit = async () => {
        if (!selectedContact || cart.length === 0) return;
        if (isPaid && paymentMethod !== 'check' && !selectedAccountId) {
            alert('Lütfen ödemenin alınacağı kasa/banka hesabını seçin.');
            return;
        }

        setLoading(true);
        try {
            const result = await createServiceOrder({
                contact_id: selectedContact.type === 'personnel' ? undefined : selectedContact.id,
                employee_id: selectedContact.type === 'personnel' ? selectedContact.id : undefined,
                items: cart,
                total: cartTotal,
                currency: 'TRY',
                notes: notes,
                paymentMethod: isPaid ? paymentMethod : undefined,
                paymentAccountId: isPaid ? selectedAccountId : undefined,
                checkDetails: isPaid && paymentMethod === 'check' ? checkDetails : undefined
            });

            if (result.success) {
                router.push('/admin/orders');
                router.refresh();
            } else {
                alert(result.error);
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Configuration & Selection */}
            <div className="lg:col-span-8 space-y-12">

                {/* 1. Contact Selection */}
                <div className={`bg-white p-10 rounded-[3rem] border-2 transition-all ${selectedContact ? 'border-emerald-100 shadow-sm' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedContact ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight">Müşteri / Cari Seçimi</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Siparişin kesileceği taraf</p>
                        </div>
                        {selectedContact && (
                            <button onClick={() => setSelectedContact(null)} className="ml-auto text-[10px] font-black text-rose-500 uppercase hover:underline">Değiştir</button>
                        )}
                    </div>

                    {!selectedContact ? (
                        <div className="relative">
                            <input
                                type="text"
                                value={contactSearch}
                                onChange={e => setContactSearch(e.target.value)}
                                placeholder="İsim, Şirket veya Telefon ile ara..."
                                className="w-full px-8 py-5 bg-gray-50 rounded-[2rem] border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg placeholder:text-gray-300"
                            />
                            {contacts.length > 0 && contactSearch.length > 1 && (
                                <div className="absolute top-full left-0 w-full mt-4 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl z-50 overflow-hidden">
                                    {contacts.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedContact(c)}
                                            className="w-full px-8 py-5 text-left hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-none flex justify-between items-center group"
                                        >
                                            <div>
                                                <div className="font-black text-gray-900 group-hover:text-indigo-600">{c.company_name || `${c.first_name} ${c.last_name}`}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.type === 'personnel' ? 'PERSONEL' : 'CARİ'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-black text-indigo-600">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(c.balance || 0)}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 animate-in zoom-in-95 duration-300">
                            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                                {(selectedContact.company_name || selectedContact.first_name || '?')[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="text-xl font-black text-gray-900">{selectedContact.company_name || `${selectedContact.first_name} ${selectedContact.last_name}`}</div>
                                <div className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Seçili Cari Müşteri</div>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Cari Bakiye</div>
                                <div className="text-lg font-black text-gray-900">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedContact.balance || 0)}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Service Selection & Config */}
                {selectedContact && (
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <WrenchScrewdriverIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 uppercase text-sm tracking-tight">Hizmet Yapılandırma</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Akıllı Seçenekler</p>
                            </div>
                        </div>

                        {!activeService ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            setActiveService(s);
                                            // Initialize activeValues with defaults to ensure fields are controlled and calc works
                                            const defaults: Record<string, any> = {};
                                            s.service_config?.inputs?.forEach(inp => {
                                                defaults[inp.id] = inp.type === 'number' ? 0 : (inp.type === 'toggle' ? false : '');
                                            });
                                            setActiveValues(defaults);
                                        }}
                                        className="p-6 text-left border border-gray-100 rounded-[2.5rem] hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all group flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl group-hover:bg-indigo-50 transition-colors">🛠️</div>
                                        <div className="flex-1">
                                            <div className="font-black text-gray-900 group-hover:text-indigo-600 uppercase text-sm">{s.title}</div>
                                            <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase mt-1">
                                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(getBasePrice(s))} baz fiyat
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[2rem]">
                                    <span className="text-2xl">🛠️</span>
                                    <div className="flex-1">
                                        <div className="text-xl font-black text-gray-900 uppercase tracking-tight">{activeService.title}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Yapılandırılıyor</div>
                                            <div className="text-[10px] text-indigo-600 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                                                Baz Fiyat: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(getBasePrice(activeService))}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveService(null)} className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase hover:text-gray-900">Vazgeç</button>
                                </div>

                                {/* Dynamic Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                                    {activeService.service_config?.inputs?.map((input: any) => (
                                        <div key={input.id} className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{input.label}</label>

                                            {input.type === 'number' && (
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={activeValues[input.id] ?? ''}
                                                        onChange={e => setActiveValues({ ...activeValues, [input.id]: Math.max(0, parseFloat(e.target.value) || 0) })}
                                                        className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl border-2 border-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg text-gray-900"
                                                        placeholder={input.placeholder || '0'}
                                                    />
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-12">{input.unit || ''}</span>
                                                </div>
                                            )}

                                            {input.type === 'toggle' && (
                                                <button
                                                    onClick={() => setActiveValues({ ...activeValues, [input.id]: !activeValues[input.id] })}
                                                    className={`w-full px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${activeValues[input.id] ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'}`}
                                                >
                                                    {activeValues[input.id] ? 'Seçildi ✓' : 'Seçilmedi'}
                                                </button>
                                            )}

                                            {input.type === 'select' && (
                                                <select
                                                    value={activeValues[input.id] ?? ''}
                                                    onChange={e => setActiveValues({ ...activeValues, [input.id]: e.target.value })}
                                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg text-gray-900"
                                                >
                                                    <option value="">Seçiniz...</option>
                                                    {input.options?.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {!['number', 'toggle', 'select'].includes(input.type) && (
                                                <input
                                                    type="text"
                                                    value={activeValues[input.id] ?? ''}
                                                    onChange={e => setActiveValues({ ...activeValues, [input.id]: e.target.value })}
                                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg text-gray-900"
                                                    placeholder={input.label}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Item Summary & Add */}
                                <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hesaplanan Kalem Tutarı</div>
                                        <div className="text-3xl font-black text-indigo-600 font-mono">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalPrice)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={addToCart}
                                        className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                                    >
                                        <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                        Siparişe Ekle
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Cart & Summary */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-gray-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-10 sticky top-8">
                    <div className="flex items-center gap-4">
                        <ShoppingCartIcon className="w-6 h-6 text-emerald-400" />
                        <h3 className="font-black uppercase text-sm tracking-widest">Sipariş Özeti</h3>
                    </div>

                    <div className="space-y-4 min-h-[100px]">
                        {cart.length === 0 ? (
                            <div className="py-12 text-center text-gray-500 italic text-xs">
                                Henüz hizmet eklenmedi.
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={item.id} className="bg-white/5 p-5 rounded-3xl border border-white/10 group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-xs font-black uppercase text-emerald-400 mb-1">{item.title}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{item.sku}</div>
                                        </div>
                                        <button
                                            onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                                            className="text-gray-600 hover:text-rose-400 transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="text-right text-lg font-black text-white font-mono">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.price)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-10 border-t border-white/10 space-y-8">
                        {/* Payment Method Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2 bg-white/5 rounded-2xl p-1 border border-white/10">
                                <button
                                    onClick={() => setIsPaid(false)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isPaid ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >Açık (Borç)</button>
                                <button
                                    onClick={() => setIsPaid(true)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPaid ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >Ödendi (Peşin)</button>
                            </div>

                            {isPaid && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Ödeme Kanalı</div>
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) => {
                                                setPaymentMethod(e.target.value as any);
                                                setSelectedAccountId('');
                                            }}
                                            className="w-full bg-transparent border-none text-white text-sm font-black outline-none cursor-pointer"
                                        >
                                            <option value="cash" className="bg-gray-800">Nakit (Kasa)</option>
                                            <option value="eft" className="bg-gray-800">EFT / Havale (Banka)</option>
                                            <option value="credit_card" className="bg-gray-800">Kredi Kartı (POS)</option>
                                            <option value="check" className="bg-gray-800">Çek</option>
                                        </select>
                                    </div>

                                    {paymentMethod !== 'check' && (
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                                {paymentMethod === 'cash' ? 'Kasa Seçin' : paymentMethod === 'eft' ? 'Banka Seçin' : 'POS Cihazı Seçin'}
                                            </div>
                                            <select
                                                value={selectedAccountId}
                                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                                className="w-full bg-transparent border-none text-white text-sm font-bold outline-none cursor-pointer"
                                            >
                                                <option value="" className="bg-gray-800 text-gray-500">Hesap Seçiniz...</option>
                                                {financeAccounts
                                                    .filter(a => {
                                                        if (paymentMethod === 'cash') return a.type === 'safe';
                                                        if (paymentMethod === 'eft') return a.type === 'bank';
                                                        if (paymentMethod === 'credit_card') return a.type === 'pos';
                                                        return false;
                                                    })
                                                    .map(acc => (
                                                        <option key={acc.id} value={acc.id} className="bg-gray-800">
                                                            {acc.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}

                                    {paymentMethod === 'check' && (
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Banka Adı"
                                                value={checkDetails.bankName}
                                                onChange={e => setCheckDetails({ ...checkDetails, bankName: e.target.value })}
                                                className="w-full bg-white/5 text-white p-3 rounded-xl text-xs outline-none border border-white/10 focus:border-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Çek Seri No"
                                                value={checkDetails.serialNumber}
                                                onChange={e => setCheckDetails({ ...checkDetails, serialNumber: e.target.value })}
                                                className="w-full bg-white/5 text-white p-3 rounded-xl text-xs outline-none border border-white/10 focus:border-emerald-500"
                                            />
                                            <input
                                                type="date"
                                                value={checkDetails.dueDate}
                                                onChange={e => setCheckDetails({ ...checkDetails, dueDate: e.target.value })}
                                                className="w-full bg-white/5 text-white p-3 rounded-xl text-xs outline-none border border-white/10 focus:border-emerald-500 invert brightness-200 contrast-50"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Sipariş Notu</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Örn: Kapıda ödeme istenecek, acil kurulum..."
                                className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-5 text-white text-xs outline-none focus:border-emerald-500 transition-all min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Genel Toplam</span>
                            <span className="text-4xl font-black text-emerald-400 font-mono">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cartTotal)}
                            </span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || cart.length === 0 || !selectedContact}
                            className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-400 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center gap-4"
                        >
                            {loading ? (
                                <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    Siparişi Tamamla
                                    <CheckCircleIcon className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
