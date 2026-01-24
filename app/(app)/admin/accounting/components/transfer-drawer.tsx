'use client';

import { useState, useEffect } from 'react';
import {
    getFinanceAccounts,
    getChecks,
    transferFunds,
    payIssuedCheck,
    collectReceivedCheck,
    payCreditCardDebt
} from '@/app/actions/finance';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { ArrowRightIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface Props {
    onClose: () => void;
    initialType?: 'transfer' | 'check' | 'cc';
}

export default function TransferDrawer({ onClose, initialType = 'transfer' }: Props) {
    const searchParams = useSearchParams();
    const initialCheckId = searchParams.get('checkId') || '';
    const initialSubMode = (searchParams.get('subMode') as 'pay' | 'collect') || 'pay';
    const initialSourceId = searchParams.get('sourceId') || '';
    const initialDestId = searchParams.get('destId') || '';

    const [mode, setMode] = useState<'transfer' | 'check' | 'cc'>(initialType || 'transfer');
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [checks, setChecks] = useState<any[]>([]);

    // Form State
    const [sourceId, setSourceId] = useState(initialSourceId);
    const [destId, setDestId] = useState(initialDestId);
    const [selectedCheckId, setSelectedCheckId] = useState(initialCheckId);
    const [checkSubMode, setCheckSubMode] = useState<'pay' | 'collect'>(initialSubMode);

    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        async function load() {
            const accs = await getFinanceAccounts();
            setAccounts(accs);
        }
        load();
    }, []);

    useEffect(() => {
        if (mode === 'check') {
            async function loadChecks() {
                const results = await getChecks({
                    type: checkSubMode === 'pay' ? 'issued' : 'received',
                    status: 'portfolio'
                });
                setChecks(results);
                setSelectedCheckId('');
                setAmount(0);
            }
            loadChecks();
        }
    }, [mode, checkSubMode]);

    useEffect(() => {
        if (selectedCheckId) {
            const check = checks.find(c => c.id === selectedCheckId);
            if (check) {
                setAmount(Number(check.amount));
                setDescription(`${checkSubMode === 'pay' ? 'Çek Ödemesi' : 'Çek Tahsilatı'} - ${check.bank_name} - ${check.serial_number}`);
            }
        }
    }, [selectedCheckId]);

    const handleSubmit = async () => {
        if (amount <= 0) return toast.error('Lütfen geçerli bir tutar girin.');

        setLoading(true);
        try {
            let res: any;
            if (mode === 'transfer') {
                if (!sourceId || !destId) throw new Error('Kaynak ve hedef hesap seçimi zorunludur.');
                res = await transferFunds({
                    sourceAccountId: sourceId,
                    destinationAccountId: destId,
                    amount,
                    date,
                    description: description || 'Hesaplar arası transfer'
                });
            } else if (mode === 'cc') {
                if (!sourceId || !destId) throw new Error('Banka ve kredi kartı hesabı seçimi zorunludur.');
                res = await payCreditCardDebt(destId, sourceId, amount, date);
            } else if (mode === 'check') {
                if (!selectedCheckId) throw new Error('Lütfen bir çek seçin.');
                if (!sourceId) throw new Error('Lütfen işlem yapılacak banka/kasa hesabını seçin.');

                if (checkSubMode === 'pay') {
                    res = await payIssuedCheck(selectedCheckId, sourceId, date);
                } else {
                    res = await collectReceivedCheck(selectedCheckId, sourceId, date);
                }
            }

            if (res.success) {
                toast.success('İşlem başarıyla kaydedildi.');
                onClose();
                window.location.reload();
            } else {
                toast.error(res.error);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Mode Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-100 shadow-inner">
                <button
                    onClick={() => setMode('transfer')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${mode === 'transfer' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    💸 VIRMAN
                </button>
                <button
                    onClick={() => setMode('check')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${mode === 'check' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    🧾 ÇEK İŞLEMLERİ
                </button>
                <button
                    onClick={() => setMode('cc')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${mode === 'cc' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    💳 KK ÖDEME
                </button>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">

                {mode === 'check' && (
                    <div className="flex bg-gray-50 p-1 rounded-xl mb-4">
                        <button
                            onClick={() => setCheckSubMode('pay')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest ${checkSubMode === 'pay' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}
                        >VERİLEN ÇEK ÖDEME</button>
                        <button
                            onClick={() => setCheckSubMode('collect')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest ${checkSubMode === 'collect' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500'}`}
                        >ALINAN ÇEK TAHSİLATI</button>
                    </div>
                )}

                {/* Specific for Check Mode: Check Selection */}
                {mode === 'check' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            {checkSubMode === 'pay' ? 'ÖDENECEK ÇEK (VERİLEN)' : 'TAHSİL EDİLECEK ÇEK (ALINAN)'}
                        </label>
                        <select
                            value={selectedCheckId}
                            onChange={(e) => setSelectedCheckId(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                        >
                            <option value="">Çek seçiniz...</option>
                            {checks.map(c => (
                                <option key={c.id} value={c.id}>
                                    Vade: {new Date(c.due_date).toLocaleDateString('tr-TR')} - {c.bank_name} - {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(c.amount)}
                                </option>
                            ))}
                        </select>
                        {checks.length === 0 && <p className="text-[9px] text-amber-600 font-bold px-1 italic">Gösterilecek uygun çek bulunamadı.</p>}
                    </div>
                )}

                {/* Source Account */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        {mode === 'check' && checkSubMode === 'collect' ? 'GİRİŞ YAPILACAK HESAP' : 'KAYNAK HESAP (PARA ÇIKIŞI)'}
                    </label>
                    <select
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    >
                        <option value="">Seçiniz...</option>
                        {accounts.filter(a => ['bank', 'safe'].includes(a.type)).map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} ({new Intl.NumberFormat('tr-TR', { style: 'currency', currency: acc.currency }).format(acc.balance)})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Destination Account (Only for Transfer & CC) */}
                {mode !== 'check' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            {mode === 'transfer' ? 'HEDEF HESAP (PARA GİRİŞİ)' : 'KREDİ KARTI HESABI'}
                        </label>
                        <select
                            value={destId}
                            onChange={(e) => setDestId(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                        >
                            <option value="">Seçiniz...</option>
                            {accounts
                                .filter(a => mode === 'transfer' ? (['bank', 'safe', 'pos'].includes(a.type) && a.id !== sourceId) : a.type === 'credit_card')
                                .map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({new Intl.NumberFormat('tr-TR', { style: 'currency', currency: acc.currency }).format(acc.balance)})
                                    </option>
                                ))}
                        </select>
                    </div>
                )}

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TUTAR</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={mode === 'check'}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TARİH</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AÇIKLAMA (OPSİYONEL)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="İşlem detayı..."
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 mt-4 active:scale-95"
                >
                    {loading ? 'İŞLENİYOR...' : 'İŞLEMİ TAMAMLA'}
                </button>
            </div>
        </div>
    );
}
