'use client';

import { useState, useEffect } from 'react';
import { searchEntities } from '@/app/actions/accounting';
import TradeForm from '@/app/(app)/admin/accounting/components/trade-form';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Props {
    type?: 'sale' | 'purchase';
    onClose?: () => void;
}

export default function GlobalOrderDrawer({ type = 'sale', onClose }: Props) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useState<any>(null);

    useEffect(() => {
        async function loadContacts() {
            setLoading(true);
            try {
                // Fetch entities (Contacts + Personnel)
                const data = await searchEntities(search);
                setContacts(data);
            } catch (error) {
                console.error('Contacts load error', error);
            } finally {
                setLoading(false);
            }
        }

        // Debounce search
        const timer = setTimeout(() => {
            loadContacts();
        }, 300);

        return () => clearTimeout(timer);
    }, [search]); // Removed 'type' dependency as we don't filter by it anymore

    const handleSelectContact = (contact: any) => {
        setSelectedContact(contact);
        setStep(2);
    };

    if (step === 1) {
        return (
            <div className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-gray-900">Cari Seçimi</h3>
                    <p className="text-sm text-gray-500">İşlem yapmak istediğiniz cariyi seçin veya yeni oluşturun.</p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari ara..."
                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />
                    {loading && (
                        <div className="absolute right-3 top-3">
                            <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    {contacts.map((contact) => (
                        <button
                            key={contact.id}
                            onClick={() => handleSelectContact(contact)}
                            className="w-full p-4 flex items-center justify-between text-left bg-white border border-gray-100 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group"
                        >
                            <div>
                                <div className="font-bold text-gray-900 group-hover:text-indigo-600">
                                    {contact.company_name || `${contact.first_name} ${contact.last_name}` || contact.name}
                                </div>
                                {(contact.company_name) && (
                                    <div className="text-xs text-gray-500">{contact.first_name} {contact.last_name}</div>
                                )}
                                {contact.type === 'personnel' && (
                                    <div className="text-[10px] inline-block mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">PERSONEL</div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-bold ${Number(contact.balance) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(contact.balance || 0))}
                                </div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Bakiye</div>
                            </div>
                        </button>
                    ))}

                    {contacts.length === 0 && !loading && (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-500 mb-4">Kayıt bulunamadı.</p>
                            <Link
                                href={type === 'sale' ? "/admin/accounting/customers?drawer=add-customer" : "/admin/accounting/suppliers?drawer=add-supplier"}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                {type === 'sale' ? 'Yeni Müşteri Oluştur' : 'Yeni Tedarikçi Oluştur'}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <TradeForm
            contact={selectedContact}
            type={type}
            onClose={() => onClose?.()}
            onSuccess={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('drawer');
                url.searchParams.delete('id');
                window.history.pushState({}, '', url.toString());
                onClose?.();
                // Force a full refresh to sync all lists and stats
                window.location.reload();
            }}
        />
    );
}
