'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveEmployee, addPersonnelTransaction } from '@/app/actions/personnel';
import Link from 'next/link';

interface Props {
    initialData: any | null;
    ledger?: any[];
}

export default function EmployeeEditorClient({ initialData, ledger = [] }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [employee, setEmployee] = useState(initialData || {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        worker_type: 'monthly',
        base_salary: 0,
        daily_rate: 0,
        hire_date: new Date().toISOString().substring(0, 10),
        is_active: true
    });

    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transaction, setTransaction] = useState({
        type: 'advance',
        amount: '',
        description: '',
        date: new Date().toISOString().substring(0, 10)
    });

    const isNew = !initialData;

    async function handleSave() {
        if (!employee.first_name || !employee.last_name) {
            alert('Lütfen personelin adını ve soyadını girin.');
            return;
        }

        setLoading(true);
        const result = await saveEmployee(employee);
        setLoading(false);

        if (result.success) {
            router.push('/admin/personnel/employees');
            router.refresh();
        } else {
            alert(result.error || 'Kaydedilirken bir hata oluştu.');
        }
    }

    async function handleAddTransaction() {
        if (!transaction.amount || isNaN(Number(transaction.amount))) {
            alert('Geçerli bir tutar girin.');
            return;
        }

        setLoading(true);
        const result = await addPersonnelTransaction({
            ...transaction,
            amount: Number(transaction.amount),
            employee_id: initialData.id
        });
        setLoading(false);

        if (result.success) {
            setShowTransactionModal(false);
            setTransaction({
                type: 'advance',
                amount: '',
                description: '',
                date: new Date().toISOString().substring(0, 10)
            });
            router.refresh();
        } else {
            alert(result.error || 'İşlem kaydedilirken bir hata oluştu.');
        }
    }

    const balance = Number(initialData?.personnel_balances?.[0]?.balance || 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/personnel" className="hover:text-indigo-600 transition-colors">Personel</Link>
                        <span>/</span>
                        <Link href="/admin/personnel/employees" className="hover:text-indigo-600 transition-colors">Rehber</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">{isNew ? 'Yeni Kayıt' : 'Profil Düzenle'}</span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        {isNew ? 'Yeni Personel Kaydı' : `${employee.first_name} ${employee.last_name}`}
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sol Kolon: Bilgiler */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ad</label>
                                <input
                                    type="text"
                                    value={employee.first_name || ''}
                                    onChange={e => setEmployee({ ...employee, first_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Örn: Ahmet"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Soyad</label>
                                <input
                                    type="text"
                                    value={employee.last_name || ''}
                                    onChange={e => setEmployee({ ...employee, last_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Örn: Yılmaz"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">E-Posta</label>
                                <input
                                    type="email"
                                    value={employee.email || ''}
                                    onChange={e => setEmployee({ ...employee, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="ahmet@sirket.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Telefon</label>
                                <input
                                    type="text"
                                    value={employee.phone || ''}
                                    onChange={e => setEmployee({ ...employee, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="05..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pozisyon / Görev</label>
                            <input
                                type="text"
                                value={employee.position || ''}
                                onChange={e => setEmployee({ ...employee, position: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                placeholder="Örn: Mobilya Ustası"
                            />
                        </div>
                    </div>

                    {!isNew && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 text-lg">Finansal Geçmiş (Ledger)</h3>
                                <button
                                    onClick={() => setShowTransactionModal(true)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                                >
                                    + Ödeme / İşlem Ekle
                                </button>
                            </div>
                            <div className="overflow-auto max-h-[400px]">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Tarih</th>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Tür</th>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Açıklama</th>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px] text-right">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {ledger.map((tx: any) => (
                                            <tr key={tx.id}>
                                                <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                                                <td className="px-6 py-4 font-medium capitalize">{tx.type}</td>
                                                <td className="px-6 py-4 text-gray-400">{tx.description || '-'}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${['earning', 'bonus'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {['earning', 'bonus'].includes(tx.type) ? '+' : '-'}{new Intl.NumberFormat('tr-TR').format(tx.amount)} TL
                                                </td>
                                            </tr>
                                        ))}
                                        {ledger.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">Henüz bir finansal işlem kaydı yok.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sağ Kolon: Finansal Ayarlar */}
                <div className="space-y-6">
                    {!isNew && (
                        <div className={`p-8 rounded-3xl border shadow-sm flex flex-col items-center text-center ${balance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                            <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Güncel Bakiye</div>
                            <div className={`text-3xl font-black ${balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(balance)}
                            </div>
                            <div className="text-[10px] font-bold mt-2 uppercase tracking-tighter opacity-50">
                                {balance >= 0 ? 'Personel Alacaklı' : 'Personel Borçlu (Avans)'}
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Çalışma Şekli</label>
                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-2xl">
                                <button
                                    onClick={() => setEmployee({ ...employee, worker_type: 'monthly' })}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all ${employee.worker_type === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    AYLIK MAAŞ
                                </button>
                                <button
                                    onClick={() => setEmployee({ ...employee, worker_type: 'daily' })}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all ${employee.worker_type === 'daily' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    GÜNLÜK YEVMİYE
                                </button>
                            </div>
                        </div>

                        {employee.worker_type === 'monthly' ? (
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Net Aylık Maaş</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={employee.base_salary || 0}
                                        onChange={e => setEmployee({ ...employee, base_salary: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono font-bold"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">TL</span>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Günlük Yevmiye</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={employee.daily_rate || 0}
                                        onChange={e => setEmployee({ ...employee, daily_rate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono font-bold text-amber-700"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">TL</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">İşe Giriş Tarihi</label>
                            <input
                                type="date"
                                value={employee.hire_date || ''}
                                onChange={e => setEmployee({ ...employee, hire_date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 pb-0 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900">İşlem Ekle</h3>
                            <button onClick={() => setShowTransactionModal(false)} className="text-gray-400 hover:text-gray-900">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">İşlem Türü</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['advance', 'payment', 'bonus', 'penalty'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setTransaction({ ...transaction, type })}
                                            className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-2 ${transaction.type === type ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            {type === 'advance' ? 'AVANS (-)' : type === 'payment' ? 'ÖDEME (-)' : type === 'bonus' ? 'PRİM (+)' : 'KESİNTİ (-)'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tutar (TL)</label>
                                <input
                                    type="number"
                                    value={transaction.amount}
                                    onChange={e => setTransaction({ ...transaction, amount: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-black text-lg"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tarih</label>
                                <input
                                    type="date"
                                    value={transaction.date}
                                    onChange={e => setTransaction({ ...transaction, date: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Açıklama</label>
                                <input
                                    type="text"
                                    value={transaction.description}
                                    onChange={e => setTransaction({ ...transaction, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Örn: Nakit avans"
                                />
                            </div>
                            <button
                                onClick={handleAddTransaction}
                                disabled={loading}
                                className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all shadow-lg disabled:opacity-50"
                            >
                                {loading ? 'İŞLENİYOR...' : 'KAYDI TAMAMLA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
