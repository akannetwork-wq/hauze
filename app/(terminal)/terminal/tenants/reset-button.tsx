'use client';

import { useState } from 'react';
import { resetTenantData } from '@/app/actions/terminal-queries';
import { toast } from 'react-hot-toast';
import Portal from '@/components/ui/portal';

interface ResetTenantButtonProps {
    tenantId: string;
    tenantName: string;
}

export default function ResetTenantButton({ tenantId, tenantName }: ResetTenantButtonProps) {
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (confirmText !== 'RESET') return;

        setLoading(true);
        try {
            await resetTenantData(tenantId);
            toast.success(`${tenantName} verileri başarıyla sıfırlandı.`);
            setOpen(false);
            setConfirmText('');
        } catch (error) {
            console.error('Reset error:', error);
            toast.error('Veriler sıfırlanırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-2 hover:bg-red-900/30 rounded-xl transition-all text-red-500 group"
                title="Sıfırla"
            >
                <span className="grayscale group-hover:grayscale-0 transition-all">🗑️</span>
            </button>

            {open && (
                <Portal>
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
                            {/* Header */}
                            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">
                                        ⚠️ Verileri Sıfırla
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-1">{tenantName}</p>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
                                >✕</button>
                            </div>

                            <div className="p-8 space-y-6">
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Bu işlem <strong>{tenantName}</strong> adlı tenanta ait tüm Satış, Alım, Stok, Cari ve Personel verilerini <span className="text-red-500 font-bold underline">kalıcı olarak silecektir.</span>
                                </p>

                                <p className="text-gray-400 text-xs italic">
                                    Not: Site sayfaları ve temel ayarlar korunacaktır.
                                </p>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                        Onaylamak için RESET yazın
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                        placeholder="RESET"
                                        className="w-full bg-gray-800 border-none rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-red-500 transition-all text-white font-black tracking-widest placeholder:text-gray-700"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-8 bg-gray-900/50 border-t border-gray-800 flex gap-4">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:text-white transition-all border border-transparent hover:border-gray-800"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={confirmText !== 'RESET' || loading}
                                    className={`flex-[1.5] py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${confirmText === 'RESET' && !loading
                                            ? 'bg-red-600 shadow-red-900/20 hover:bg-red-700 hover:-translate-y-1'
                                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? 'Siliniyor...' : 'Tümünü Temizle'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    );
}
