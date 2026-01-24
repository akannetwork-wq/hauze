'use client';

import { useState } from 'react';
import { saveContact } from '@/app/actions/accounting';
import { useRouter } from 'next/navigation';

interface Props {
    initialData?: any;
    type: 'customer' | 'supplier' | 'subcontractor';
    onSuccess?: () => void;
}

export default function ContactEditor({ initialData, type, onSuccess }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        id: initialData?.id,
        type: type,
        company_name: initialData?.company_name || '',
        first_name: initialData?.first_name || '',
        last_name: initialData?.last_name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        tax_id: initialData?.tax_id || '',
        tax_office: initialData?.tax_office || '',
        address: initialData?.address || ''
    });

    async function handleSubmit() {
        if (!form.company_name && (!form.first_name || !form.last_name)) {
            alert('Lütfen firma adı veya ad/soyad girin.');
            return;
        }

        setLoading(true);
        const res = await saveContact(form);
        setLoading(false);

        if (res.success) {
            router.refresh();
            if (onSuccess) onSuccess();
        } else {
            alert('Hata: ' + res.error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Firma Adı</label>
                    <input
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                        value={form.company_name}
                        onChange={e => setForm({ ...form, company_name: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İsim</label>
                        <input
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            value={form.first_name}
                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Soyisim</label>
                        <input
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            value={form.last_name}
                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">E-posta</label>
                        <input
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Telefon</label>
                        <input
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Vergi No</label>
                        <input
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            value={form.tax_id}
                            onChange={e => setForm({ ...form, tax_id: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Vergi Dairesi</label>
                        <input
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500"
                            value={form.tax_office}
                            onChange={e => setForm({ ...form, tax_office: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Adres</label>
                    <textarea
                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                </div>
            </div>

            <div className="pt-6">
                <button
                    disabled={loading}
                    onClick={handleSubmit}
                    className="w-full bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
                >
                    {loading ? 'Kaydediliyor...' : initialData?.id ? 'Bilgileri Güncelle' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
}
