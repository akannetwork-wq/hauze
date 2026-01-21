'use client';

import { useState } from 'react';
import { updatePersonnelSettings } from '@/app/actions/personnel';
import { useRouter } from 'next/navigation';

interface Props {
    settings: {
        salary_payment_day: number;
        weekly_payment_day: number;
    };
}

export default function PersonnelSettingsClient({ settings }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(settings);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const res = await updatePersonnelSettings(form);
        setLoading(false);
        if (res.success) {
            router.refresh();
            router.push('/admin/personnel');
        } else {
            alert('Hata: ' + res.error);
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-12">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8">
                <h1 className="text-2xl font-black text-gray-900 mb-2">Kurumsal Personel Ayarları</h1>
                <p className="text-gray-500 text-sm mb-8">Maaş periyotlarını ve ödeme günlerini buradan belirleyin.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Monthly Day */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                            Aylık Maaş Ödeme Günü
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="w-24 bg-gray-50 border-none rounded-2xl px-4 py-4 text-xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                                value={form.salary_payment_day}
                                onChange={e => setForm({ ...form, salary_payment_day: parseInt(e.target.value) || 1 })}
                            />
                            <p className="text-sm text-gray-500">
                                Her ayın <b>{form.salary_payment_day}.</b> günü maaş haftası olarak işaretlenir.
                            </p>
                        </div>
                    </div>

                    {/* Weekly Day */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                            Haftalık (Yevmiyeli) Ödeme Günü
                        </label>
                        <select
                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                            value={form.weekly_payment_day}
                            onChange={e => setForm({ ...form, weekly_payment_day: parseInt(e.target.value) })}
                        >
                            <option value={1}>Pazartesi</option>
                            <option value={2}>Salı</option>
                            <option value={3}>Çarşamba</option>
                            <option value={4}>Perşembe</option>
                            <option value={5}>Cuma</option>
                            <option value={6}>Cumartesi</option>
                            <option value={0}>Pazar</option>
                        </select>
                        <p className="text-xs text-gray-400 italic">
                            Yevmiyeli personel için ödemelerin genellikle yapıldığı haftalık gün.
                        </p>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all uppercase tracking-widest"
                        >
                            {loading ? 'Kaydediliyor...' : 'Ayarları Güncelle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
