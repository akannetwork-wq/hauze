'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveEmployee, addPersonnelTransaction, deletePersonnelTransaction } from '@/app/actions/personnel';
import { createUser } from '@/app/actions/users';
import Link from 'next/link';
import { KeyIcon, CheckCircleIcon, GlobeAltIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface Props {
    initialData: any | null;
    ledger?: any[];
    isDrawer?: boolean;
}

export default function EmployeeEditorClient({ initialData, ledger = [], isDrawer = false }: Props) {
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
    const [showPortalModal, setShowPortalModal] = useState(false);
    const [portalData, setPortalData] = useState({
        email: initialData?.email || '',
        password: ''
    });
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
            if (isDrawer) {
                // If in drawer, close it properly via router to ensure state sync
                const url = new URL(window.location.href);
                url.searchParams.delete('drawer');
                url.searchParams.delete('id');

                // Use router.push to update URL and then refresh to re-fetch data
                router.push(url.pathname + '?' + url.searchParams.toString(), { scroll: false });
                router.refresh();
            } else {
                router.push('/admin/personnel/employees');
                router.refresh();
            }
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

    async function handleDeleteTransaction(id: string) {
        if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;

        setLoading(true);
        const result = await deletePersonnelTransaction(id);
        setLoading(false);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.error || 'İşlem silinirken bir hata oluştu.');
        }
    }

    async function handleCreatePortalAccount() {
        if (!portalData.email || !portalData.password) {
            toast.error('E-posta ve şifre zorunludur.');
            return;
        }

        setLoading(true);
        const result = await createUser(portalData.email, portalData.password, 'user', initialData.id);
        setLoading(false);

        if (result.success) {
            toast.success('Personel portal hesabı oluşturuldu.');
            setShowPortalModal(false);
            router.refresh();
        } else {
            toast.error('Hata: ' + result.error);
        }
    }

    return (
        <div className={`space-y-8 ${isDrawer ? 'pb-32' : ''}`}>

            {!isDrawer && (
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
                </div>

            )}

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


            {!isDrawer && (
                <div className="flex justify-end mb-4 gap-3">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            )}

            <div className={`grid grid-cols-1 ${isDrawer ? '' : 'lg:grid-cols-3'} gap-8`}>

                {/* Sol Kolon: Bilgiler */}
                <div className={`${isDrawer ? '' : 'lg:col-span-2'} space-y-6`}>


                    {!isNew && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center text-left">
                                <h3 className="font-bold text-gray-900 text-lg">Finansal Geçmiş (Ledger)</h3>
                                <button
                                    onClick={() => setShowTransactionModal(true)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                                >
                                    + Ödeme / İşlem Ekle
                                </button>
                            </div>
                            <div className="overflow-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Tarih</th>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Tür</th>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px]">Açıklama</th>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px] text-right">Tutar</th>
                                            <th className="px-6 py-3 font-bold text-gray-400 uppercase text-[10px] text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {ledger.map((tx: any) => (
                                            <tr key={tx.id}>
                                                <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                                                <td className="px-6 py-4 font-medium capitalize">{tx.type}</td>
                                                <td className="px-6 py-4 text-gray-400">{tx.description || '-'}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${['earning', 'bonus', 'payment'].includes(tx.type) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {['earning', 'bonus', 'payment'].includes(tx.type) ? '+' : '-'}{new Intl.NumberFormat('tr-TR').format(tx.amount)} TL
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {tx.source !== 'financial' && (
                                                        <button
                                                            onClick={() => handleDeleteTransaction(tx.id)}
                                                            className="text-gray-300 hover:text-rose-600 transition-colors"
                                                            title="Sil"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
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


                </div>

                {/* Sağ Kolon: Finansal Ayarlar */}
                <div className="space-y-6">

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="text-left">
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
                            <div className="text-left">
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
                            <div className="text-left">
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

                        <div className="text-left">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">İşe Giriş Tarihi</label>
                            <input
                                type="date"
                                value={employee.hire_date || ''}
                                onChange={e => setEmployee({ ...employee, hire_date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <GlobeAltIcon className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-gray-900">Portal Erişimi</h3>
                        </div>

                        {initialData?.user_id ? (
                            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-3">
                                <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs uppercase tracking-widest">
                                    <CheckCircleIcon className="w-4 h-4" /> AKTİF BAĞLANTI
                                </div>
                                <div className="text-[10px] text-emerald-600 font-bold opacity-70 text-left">
                                    Bu personel kendi portallarına giriş yapabilir.
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-left">HESAP BAĞLI DEĞİL</div>
                                <p className="text-[11px] text-gray-500 font-medium text-left">Bu personelin henüz bir portal hesabı yok.</p>
                                <button
                                    onClick={() => setShowPortalModal(true)}
                                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                                >
                                    PORTAL HESABI OLUŞTUR
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 pb-0 flex justify-between items-center text-left">
                            <h3 className="text-xl font-black text-gray-900">İşlem Ekle</h3>
                            <button onClick={() => setShowTransactionModal(false)} className="text-gray-400 hover:text-gray-900">✕</button>
                        </div>
                        <div className="p-8 space-y-6 text-left">
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

            {/* Save Button for Drawer (Sticky bottom) */}
            {isDrawer && (
                <div className="right-0 p-8 z-50 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? 'KAYDEDİLİYOR...' : 'KAYDET'}
                    </button>
                </div>
            )}

            {/* Portal Kayıt Modal */}
            {showPortalModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowPortalModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">✕</button>
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
                            <UserCircleIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2 text-left">Portal Hesabı Oluştur</h3>
                        <p className="text-gray-400 text-xs font-medium mb-8 text-left">Personel bu bilgilerle kendi paneline giriş yapacaktır.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">E-Posta</label>
                                <input
                                    type="email"
                                    value={portalData.email}
                                    onChange={e => setPortalData({ ...portalData, email: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                                    placeholder="ornek@sirket.com"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">Şifre Belirle</label>
                                <input
                                    type="password"
                                    value={portalData.password}
                                    onChange={e => setPortalData({ ...portalData, password: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                onClick={handleCreatePortalAccount}
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 mt-4"
                            >
                                {loading ? 'İŞLENİYOR...' : 'HESABI OLUŞTUR VE BAĞLA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
