'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createFinanceAccount, deleteFinanceAccount, updateFinanceAccount, AccountType } from '@/app/actions/finance';
import { PlusIcon, TrashIcon, BuildingLibraryIcon, BanknotesIcon, CreditCardIcon, BriefcaseIcon, EyeIcon, PencilSquareIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface AccountManagerProps {
    initialAccounts: any[];
    mode?: AccountType;
}

export default function AccountManager({ initialAccounts, mode }: AccountManagerProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AccountType>(mode || 'bank');
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newCurrency, setNewCurrency] = useState('TRY');
    const [newMetadata, setNewMetadata] = useState<any>({});

    const filteredAccounts = initialAccounts.filter(a => a.type === activeTab);

    // Dynamic Fields based on Type
    const getMetadataFields = (type: AccountType) => {
        switch (type) {
            case 'bank':
                return [
                    { key: 'iban', label: 'IBAN', placeholder: 'TR...', required: true },
                    { key: 'branch', label: 'Şube Adı', placeholder: 'Kadıköy Şubesi' },
                    { key: 'account_number', label: 'Hesap No', placeholder: '12345678' },
                    { key: 'kmh_limit', label: 'KMH Limiti', type: 'number', placeholder: '0' }
                ];
            case 'pos':
                return [
                    { key: 'bank_name', label: 'Bağlı Banka', placeholder: 'Garanti', required: true },
                    { key: 'commission_rate', label: 'Komisyon Oranı (%)', type: 'number', placeholder: '1.5' }
                ];
            case 'credit_card':
                return [
                    { key: 'bank_name', label: 'Banka Adı', placeholder: 'Yapı Kredi', required: true },
                    { key: 'card_limit', label: 'Limit', type: 'number', placeholder: '50000' },
                    { key: 'cutoff_day', label: 'Hesap Kesim Günü', type: 'number', placeholder: '1-31 Arası', max: 31, min: 1 }
                ];
            default:
                return [];
        }
    };

    const handleEdit = (account: any) => {
        setEditId(account.id);
        setNewName(account.name);
        setNewCurrency(account.currency);
        setNewMetadata(account.metadata || {});
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let res;
        if (editId) {
            res = await updateFinanceAccount(editId, {
                name: newName,
                currency: newCurrency,
                metadata: newMetadata
            });
        } else {
            res = await createFinanceAccount({
                name: newName,
                type: activeTab,
                currency: newCurrency,
                metadata: newMetadata
            });
        }

        if (res.success) {
            setIsFormOpen(false);
            setEditId(null);
            setNewName('');
            setNewMetadata({});
            // Toast success
            router.refresh();
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    // Calculate Balance Display
    const getDisplayBalance = (account: any) => {
        if (account.type === 'credit_card') {
            const limit = Number(account.metadata?.card_limit || 0);
            const currentDebt = account.balance || 0; // Negative if spent
            // Available = Limit + (Negative Balance)
            const available = limit + currentDebt;
            return {
                label: 'Kullanılabilir Limit',
                value: available,
                subLabel: currentDebt < 0 ? `Borç: ${Math.abs(currentDebt).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${account.currency}` : null
            };
        }
        if (account.type === 'bank') {
            const kmh = Number(account.metadata?.kmh_limit || 0);
            if (kmh > 0) {
                // Available = Balance + KMH
                const available = account.balance + kmh;
                return {
                    label: 'Kullanılabilir Bakiye (KMH Dahil)',
                    value: available,
                    subLabel: `Net Bakiye: ${account.balance?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${account.currency}`
                };
            }
        }
        return {
            label: 'Güncel Bakiye',
            value: account.balance,
            subLabel: null
        };
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
        const res = await deleteFinanceAccount(id);
        if (res.success) {
            router.refresh();
        } else {
            alert('Silinemedi: ' + res.error);
        }
    }

    const tabs = [
        { id: 'bank', label: 'Bankalar', icon: <BuildingLibraryIcon className="w-5 h-5" /> },
        { id: 'safe', label: 'Kasalar', icon: <BanknotesIcon className="w-5 h-5" /> },
        { id: 'pos', label: 'POS Cihazları', icon: <CreditCardIcon className="w-5 h-5" /> },
        { id: 'check_portfolio', label: 'Çek Portföyü', icon: <BriefcaseIcon className="w-5 h-5" /> },
        { id: 'credit_card', label: 'Kredi Kartları', icon: <CreditCardIcon className="w-5 h-5" /> },
    ];

    return (
        <div className="space-y-8">
            {/* Tabs */}
            {!mode && (
                <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as AccountType); setEditId(null); setIsFormOpen(false); }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[400px]">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                            {tabs.find(t => t.id === activeTab)?.label} Listesi
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{filteredAccounts.length}</span>
                        </h2>
                    </div>
                    <button
                        onClick={() => {
                            setEditId(null);
                            setNewName('');
                            setNewMetadata({});
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all transform hover:scale-105"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Yeni Ekle
                    </button>
                </div>

                {isFormOpen && (
                    <div className="mb-8 bg-gray-50 border border-gray-100 rounded-2xl p-6 animate-in slide-in-from-top-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                                {editId ? <PencilSquareIcon className="w-4 h-4 text-indigo-600" /> : <PlusIcon className="w-4 h-4 text-emerald-600" />}
                                {editId ? 'Hesabı Düzenle' : 'Yeni Hesap Ekle'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hesap Adı</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Örn: Garanti Bankası"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Para Birimi</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newCurrency}
                                        onChange={e => setNewCurrency(e.target.value)}
                                    >
                                        <option value="TRY">TRY</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>

                            {/* Dynamic Metadata Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {getMetadataFields(activeTab).map((field: any) => (
                                    <div key={field.key}>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{field.label}</label>
                                        <input
                                            type={field.type || 'text'}
                                            required={field.required}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder={field.placeholder}
                                            value={newMetadata[field.key] || ''}
                                            onChange={e => setNewMetadata({ ...newMetadata, [field.key]: e.target.value })}
                                            min={field.min}
                                            max={field.max}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                                <button
                                    type="button"
                                    onClick={() => { setIsFormOpen(false); setEditId(null); }}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-900 font-bold text-sm"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                                >
                                    {loading ? 'Kaydediliyor...' : (editId ? 'Güncelle' : 'Kaydet')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAccounts.map(account => {
                        const balanceInfo = getDisplayBalance(account);
                        return (
                            <div key={account.id} className="group bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-lg transition-all p-5 rounded-2xl relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-3 bg-gray-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                                        {activeTab === 'bank' && <BuildingLibraryIcon className="w-6 h-6" />}
                                        {activeTab === 'safe' && <BanknotesIcon className="w-6 h-6" />}
                                        {activeTab === 'pos' && <CreditCardIcon className="w-6 h-6" />}
                                        {activeTab === 'check_portfolio' && <BriefcaseIcon className="w-6 h-6" />}
                                        {activeTab === 'credit_card' && <CreditCardIcon className="w-6 h-6" />}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(account)}
                                            className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                                            title="Düzenle"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <Link
                                            href={`/admin/accounting/ledger/${account.id}`}
                                            className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                                            title="Ekstre Gör"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(account.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                            title="Sil"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900">{account.name}</h3>
                                <div className="text-xs font-mono text-gray-400 mt-1 mb-4">{account.code}</div>

                                {/* Metadata Display */}
                                <div className="space-y-1 mb-4">
                                    {Object.entries(account.metadata || {}).map(([key, val]: any) => (
                                        <div key={key} className="flex justify-between text-xs">
                                            <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                                            <span className="font-medium text-gray-600 truncate max-w-[120px]" title={val}>{val}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase">{balanceInfo.label}</div>
                                        {balanceInfo.subLabel && <div className="text-[10px] text-red-500 font-bold">{balanceInfo.subLabel}</div>}
                                    </div>
                                    <div className={`text-lg font-black ${account.balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {balanceInfo.value?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-xs text-gray-400">{account.currency}</span>
                                    </div>
                                </div>

                                {/* Action Bar */}
                                {(activeTab === 'bank' || activeTab === 'safe' || activeTab === 'credit_card') && (
                                    <div className="mt-5 pt-5 border-t border-gray-50 flex gap-2">
                                        {(activeTab === 'bank' || activeTab === 'safe') && (
                                            <button
                                                onClick={() => router.push(`?drawer=transfer&type=transfer&sourceId=${account.id}`)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <ArrowsRightLeftIcon className="w-3 h-3" />
                                                Transfer
                                            </button>
                                        )}
                                        {activeTab === 'credit_card' && (
                                            <button
                                                onClick={() => router.push(`?drawer=transfer&type=cc&destId=${account.id}`)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <CreditCardIcon className="w-3 h-3" />
                                                Borç Öde
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredAccounts.length === 0 && !isFormOpen && (
                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            Henüz kayıtlı {tabs.find(t => t.id === activeTab)?.label} bulunmuyor.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
