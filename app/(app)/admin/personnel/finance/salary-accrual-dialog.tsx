'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { accrueSalary } from '@/app/actions/personnel';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
}

export default function SalaryAccrualDialog({ isOpen, onClose, employee }: Props) {
    const router = useRouter();
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
    const [amount, setAmount] = useState(employee?.base_salary || 0);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (employee) {
            setAmount(employee.base_salary || 0);
            setDescription(`${month} Maaş Tahakkuku`);
        }
    }, [employee, month]);

    // Update description when month changes if it matches the pattern
    useEffect(() => {
        if (employee) {
            setDescription(`${month} Maaş Tahakkuku`);
        }
    }, [month]);

    if (!isOpen || !employee) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await accrueSalary({
                employeeId: employee.id,
                month,
                amount,
                description
            });

            if (result.success) {
                toast.success('Maaş başarıyla tahakkuk ettirildi.');
                router.refresh();
                onClose();
            } else {
                toast.error(result.error || 'Bir hata oluştu.');
            }
        } catch (error) {
            toast.error('Beklenmedik bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Ensure we only render safely on client
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                        Maaş Tahakkuk Et
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">PERSONEL</div>
                        <div className="font-black text-indigo-900 text-lg">{employee.first_name} {employee.last_name}</div>
                        <div className="text-xs text-indigo-600 font-medium">Maaş: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(employee.base_salary || 0)}</div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Dönem (Ay)</label>
                        <input
                            type="month"
                            required
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tahakkuk Tutarı</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full pl-8 p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 font-black text-xl text-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Açıklama</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'İşleniyor...' : 'Tahakkuk Et'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
