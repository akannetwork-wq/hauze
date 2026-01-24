'use client';

import React, { useState, useEffect } from 'react';
import { getContacts, getAccounts, getOpenOrders, searchEntities, getContactDetail } from '@/app/actions/accounting';
import { getFinanceAccounts, processFinanceTransaction } from '@/app/actions/finance';
import { registerOrderPayment } from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import Drawer from '@/components/admin/ui/drawer';
import { useRouter } from 'next/navigation';

interface Props {
    contact?: any;
    contactId?: string; // Added for fetching by ID
    account?: any;
    type: 'collection' | 'payment';
    onClose: () => void;
    onSuccess: () => void;
}

const PAYMENT_METHODS = [
    { id: 'cash', name: 'Nakit', icon: '💵' },
    { id: 'credit_card', name: 'Kredi Kartı', icon: '💳' }, // For collection -> POS, For payment -> CC
    { id: 'eft', name: 'EFT / Havale', icon: '🏦' },
    { id: 'check', name: 'Çek', icon: '📝' },
];

export default function PaymentDialog({ contact: propContact, contactId, account: propAccount, type, onClose, onSuccess }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data State
    const [openOrders, setOpenOrders] = useState<any[]>([]);
    const [financeAccounts, setFinanceAccounts] = useState<any[]>([]);

    // Search State (If no contact provided)
    const [searchQuery, setSearchQuery] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]); // All accounts for lookup
    const [selectedContact, setSelectedContact] = useState<any>(propContact || null);
    const [selectedAccount, setSelectedAccount] = useState<any>(propAccount || null);

    const [form, setForm] = useState({
        amount: '',
        method: 'eft' as 'cash' | 'credit_card' | 'eft' | 'check',
        date: new Date().toISOString().split('T')[0],
        description: '',
        orderId: '',
        targetAccountId: '', // Bank/Safe/POS ID
        checkDetails: { bankName: '', serialNumber: '', dueDate: '' }
    });

    const isCollection = type === 'collection';
    const actionTitle = isCollection ? 'Ödeme Al (Tahsilat)' : 'Ödeme Yap (Tediye)';

    // Load initial data (Finance Accounts & Orders if contact exists)
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const promises: Promise<any>[] = [getFinanceAccounts()];

                let effectiveContact = propContact;

                // Fetch Contact by ID if provided and no object passed
                if (!effectiveContact && contactId) {
                    const detail = await getContactDetail(contactId);
                    if (detail && detail.contact) {
                        effectiveContact = detail.contact;
                        setSelectedContact(detail.contact);
                        if (detail.account) setSelectedAccount(detail.account);
                    }
                }

                if (effectiveContact) {
                    // Pass type to getOpenOrders correctly
                    const entityType = effectiveContact.type === 'personnel' ? 'personnel' : 'contact';
                    promises.push(getOpenOrders(effectiveContact.id, entityType));
                } else {
                    // Load contacts for search & all accounts for lookup
                    promises.push(getContacts(undefined, 10)); // Initial contacts
                    promises.push(getAccounts()); // All accounts for lookup
                }

                const results = await Promise.all(promises);

                setFinanceAccounts(results[0]);

                if (effectiveContact) {
                    setOpenOrders(results[1]);
                } else {
                    setContacts(results[1]);
                    setAccounts(results[2]);
                }
            } catch (error) {
                console.error('Load error:', error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [propContact, contactId]);

    // Update derived states when selection changes
    useEffect(() => {
        if (selectedContact) {
            const entityType = selectedContact.type === 'personnel' ? 'personnel' : 'contact';
            getOpenOrders(selectedContact.id, entityType).then(setOpenOrders);

            // If we have accounts list (search mode), find the main account for this entity
            if (!selectedAccount && accounts.length > 0) {
                const acc = accounts.find(a =>
                    entityType === 'personnel'
                        ? a.employee_id === selectedContact.id
                        : a.contact_id === selectedContact.id
                );
                if (acc) setSelectedAccount(acc);
            }
        }
    }, [selectedContact]);

    // Search Handler
    async function handleSearch(query: string) {
        if (!query && !loading) setLoading(true); // Don't flicker on type
        // Use unified searchEntities
        const data = await searchEntities(query);
        setContacts(data);
        if (!query) setLoading(false);
    }

    // Debounce Search
    useEffect(() => {
        if (propContact) return; // Disable search if contact provided
        const timer = setTimeout(() => {
            if (searchQuery) handleSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter compatible accounts based on method
    const compatibleAccounts = financeAccounts.filter(acc => {
        if (form.method === 'cash') return acc.type === 'safe';
        if (form.method === 'credit_card') {
            // Collection -> POS, Payment -> Credit Card (Spending)
            return isCollection ? acc.type === 'pos' : acc.type === 'credit_card';
        }
        if (form.method === 'eft') return acc.type === 'bank';
        if (form.method === 'check') return acc.type === 'check_portfolio'; // For now assume check portfolio works for both check in/out logic
        return false;
    });

    // Auto-select first compatible account if current selection is invalid
    useEffect(() => {
        const currentValid = compatibleAccounts.find(a => a.id === form.targetAccountId);
        if (!currentValid && compatibleAccounts.length > 0) {
            setForm(prev => ({ ...prev, targetAccountId: compatibleAccounts[0].id }));
        } else if (compatibleAccounts.length === 0) {
            setForm(prev => ({ ...prev, targetAccountId: '' }));
        }
    }, [form.method, financeAccounts]); // Check dependency: compatibleAccounts is derived

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const valAmount = parseFloat(form.amount);
        if (!valAmount || valAmount <= 0) {
            toast.error('Lütfen geçerli bir tutar girin.');
            return;
        }

        if (!selectedAccount?.id) {
            // If contact has no account, we can't process transaction?
            // Actually, for generic contacts we might just need contact_id if we adjust processFinanceTransaction,
            // BUT processFinanceTransaction expects account_id.
            // If selectedAccount is null (e.g. data migration issue), we might face error.
            // We should auto-create it? Or error out?
            // Error out for now based on earlier context.
            toast.error('Bu kişi için tanımlı bir hesap bulunamadı (Hesap Kartı Yok).');
            return;
        }

        if (!form.targetAccountId) {
            toast.error('Lütfen ödemenin işleneceği Kasa/Banka seçin.');
            return;
        }

        setLoading(true);
        try {
            let res;

            // Scenario 1: Linked to an Order
            if (form.orderId) {
                res = await registerOrderPayment(
                    form.orderId,
                    valAmount,
                    form.method,
                    form.targetAccountId,
                    form.method === 'check' ? form.checkDetails : undefined
                );
            }
            // Scenario 2: Generic Payment (Balance Adjustment)
            else {
                // Determine Source/Dest
                // Customer Payment (Tahsilat): Source=CustomerAccount, Dest=SystemAccount
                // Supplier Payment (Tediye): Source=SystemAccount, Dest=SupplierAccount

                const sourceId = isCollection ? selectedAccount.id : form.targetAccountId;
                const destId = isCollection ? form.targetAccountId : selectedAccount.id;

                res = await processFinanceTransaction({
                    type: isCollection ? 'collection' : 'payment',
                    amount: valAmount,
                    sourceAccountId: sourceId,
                    destinationAccountId: destId,
                    date: form.date,
                    description: form.description || (isCollection ? 'Tahsilat' : 'Ödeme'),
                    checkDetails: form.method === 'check' ? form.checkDetails : undefined
                });
            }

            if (res.success) {
                toast.success('İşlem başarıyla kaydedildi.');
                router.refresh(); // Refresh server components
                onSuccess();
                setTimeout(() => onClose(), 300);
            } else {
                toast.error(res.error || 'Bir hata oluştu.');
            }
        } catch (error) {
            toast.error('Beklenmedik bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }

    // Labels Helper
    const targetLabel = isCollection ? 'Giriş Yapılacak Hesap (Kasa/Banka)' : 'Ödeme Yapılacak Hesap (Kasa/Banka)';

    return (
        <Drawer
            isOpen={true}
            onClose={onClose}
            title={actionTitle}
            subtitle={selectedContact ? (selectedContact.company_name || `${selectedContact.first_name} ${selectedContact.last_name}`) : 'Cari Seçimi Yapınız'}
        >
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">

                {/* Search Section - Only if no contact selected initially */}
                {!propContact && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {isCollection ? 'Kimden (Cari)' : 'Kime (Cari)'}
                        </label>

                        {selectedContact ? (
                            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                <div>
                                    <div className="font-bold text-indigo-900">
                                        {selectedContact.company_name || `${selectedContact.first_name} ${selectedContact.last_name}`}
                                    </div>
                                    <div className="text-xs text-indigo-500">
                                        Bakiye: {selectedContact.balance?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedContact(null);
                                        setSelectedAccount(null);
                                        setSearchQuery('');
                                        setOpenOrders([]);
                                        handleSearch('');
                                    }}
                                    className="p-2 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                                >
                                    ✕ Değiştir
                                </button>
                            </div>
                        ) : (
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Cari ara..."
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                    autoFocus
                                />
                                {(searchQuery || contacts.length > 0) && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                                        {contacts.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-xs">Kayıt bulunamadı.</div>
                                        ) : (
                                            contacts.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedContact(c);
                                                        setSearchQuery(c.company_name || `${c.first_name} ${c.last_name}`);
                                                    }}
                                                    className="w-full text-left px-5 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-none flex justify-between items-center group"
                                                >
                                                    <span className="font-bold text-gray-700 group-hover:text-indigo-600">
                                                        {c.company_name || `${c.first_name} ${c.last_name}`}
                                                        {c.type === 'personnel' && (
                                                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">PERSONEL</span>
                                                        )}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded ${Number(c.balance) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(c.balance || 0))}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Form Body - Only show if contact is selected */}
                {(selectedContact) && (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Payment Methods Grid */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ödeme Yöntemi</label>
                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_METHODS.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, method: m.id as any }))}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all text-sm font-bold ${form.method === m.id
                                            ? (isCollection ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-emerald-600 bg-emerald-50 text-emerald-600 shadow-sm')
                                            : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                            }`}
                                    >
                                        <span className="text-xl">{m.icon}</span>
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Account Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                {isCollection ? 'Giriş Yapılacak Hesap (Kasa/Banka)' : 'Ödeme Yapılacak Hesap (Kasa/Banka)'}
                            </label>
                            <select
                                required
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner"
                                value={form.targetAccountId}
                                onChange={e => setForm({ ...form, targetAccountId: e.target.value })}
                            >
                                <option value="">Seçiniz...</option>
                                {compatibleAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.currency})
                                    </option>
                                ))}
                            </select>
                            {compatibleAccounts.length === 0 && (
                                <p className="text-[10px] text-red-500 font-bold px-1">
                                    ⚠️ Bu yöntem için tanımlı {form.method === 'cash' ? 'Kasa' : form.method === 'eft' ? 'Banka' : 'Hesap'} bulunamadı.
                                </p>
                            )}
                        </div>

                        {/* Check Details */}
                        {form.method === 'check' && (
                            <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 space-y-3 animate-in slide-in-from-top-2">
                                <div className="text-amber-800 text-xs font-bold uppercase tracking-widest mb-1">Çek Detayları</div>
                                <input
                                    type="text" placeholder="Banka Adı" required
                                    value={form.checkDetails.bankName}
                                    onChange={e => setForm({ ...form, checkDetails: { ...form.checkDetails, bankName: e.target.value } })}
                                    className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                                <div className="flex gap-3">
                                    <input
                                        type="text" placeholder="Seri No" required
                                        value={form.checkDetails.serialNumber}
                                        onChange={e => setForm({ ...form, checkDetails: { ...form.checkDetails, serialNumber: e.target.value } })}
                                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                    <input
                                        type="date" required
                                        value={form.checkDetails.dueDate}
                                        onChange={e => setForm({ ...form, checkDetails: { ...form.checkDetails, dueDate: e.target.value } })}
                                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Related Order Selection */}
                        {openOrders.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">İlişkili Sipariş (Opsiyonel)</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner"
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

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tutar (TL)</label>
                            <div className="relative">
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full bg-gray-50 border-none rounded-3xl px-6 py-6 text-4xl font-black text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-200 shadow-inner"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300">TL</span>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">İşlem Tarihi</label>
                            <input
                                type="date"
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </div>

                        {/* Description Textarea */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Açıklama</label>
                            <textarea
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none shadow-inner"
                                placeholder="İşlem ile ilgili not..."
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        {/* Submit Action */}
                        <button
                            disabled={loading}
                            type="submit"
                            className={`w-full py-5 rounded-3xl font-black text-white shadow-xl transition-all hover:-translate-y-1 disabled:opacity-50 text-sm mt-4 ${isCollection ? 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'
                                }`}
                        >
                            {loading ? 'Kaydediliyor...' : `✨ ${actionTitle}`}
                        </button>
                    </form>
                )}
            </div>
        </Drawer>
    );
}
