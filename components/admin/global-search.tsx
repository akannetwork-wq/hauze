'use client';

import { useState, useEffect, useRef } from 'react';
import { globalSearch, SearchResult } from '@/app/actions/search';
import { useRouter } from 'next/navigation';
import TradeDialog from '@/app/(app)/admin/accounting/components/trade-dialog';
import Portal from '@/components/ui/portal';

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tradeConfig, setTradeConfig] = useState<{ contact: any, type: 'sale' | 'purchase' } | null>(null);
    const [showQuickCreate, setShowQuickCreate] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                const data = await globalSearch(query);
                setResults(data);
                setLoading(false);
                setIsOpen(true);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleNavigate = (link: string) => {
        router.push(link);
        setIsOpen(false);
        setQuery('');
        setShowQuickCreate(false);
    };

    const handleTradeAction = (contact: any, type: 'sale' | 'purchase') => {
        setTradeConfig({ contact, type });
        setIsOpen(false);
    };

    const quickOptions = [
        { label: 'Müşteri', type: 'customer', icon: '🎯', link: '/admin/accounting/customers?action=new' },
        { label: 'Tedarikçi', type: 'supplier', icon: '📦', link: '/admin/accounting/suppliers?action=new' },
        { label: 'Ürün', type: 'product', icon: '📦', link: '/admin/inventory/products/new' },
        { label: 'Sarf Malzeme', type: 'consumable', icon: '🏗️', link: '/admin/inventory/consumables/new' },
        { label: 'Personel', type: 'personnel', icon: '👤', link: '/admin/personnel/employees/new' },
    ];

    return (
        <div className="relative flex-1 max-w-2xl" ref={searchRef}>
            <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    🔍
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ürün, müşteri veya personel ara..."
                    className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm shadow-sm"
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] max-h-[70vh] overflow-hidden flex flex-col scale-100 origin-top transition-all duration-200">
                    <div className="flex-1 overflow-y-auto">
                        {results.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {results.map((r) => (
                                    <div key={r.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
                                                {r.type === 'product' && '📦'}
                                                {r.type === 'consumable' && '🏗️'}
                                                {r.type === 'service' && '🛠️'}
                                                {r.type === 'customer' && '🎯'}
                                                {r.type === 'supplier' && '📦'}
                                                {r.type === 'personnel' && '👤'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{r.title}</div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.subtitle}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Action Buttons based on type */}
                                            {['product', 'consumable', 'service', 'personnel'].includes(r.type) && (
                                                <button
                                                    onClick={() => handleNavigate(r.link)}
                                                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                                                >
                                                    Düzenleme Ekranı
                                                </button>
                                            )}

                                            {r.type === 'customer' && (
                                                <>
                                                    <button
                                                        onClick={() => handleNavigate(r.link)}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all"
                                                    >
                                                        Müşteri Kartı
                                                    </button>
                                                    <button
                                                        onClick={() => handleTradeAction({ id: r.id, company_name: r.title }, 'sale')}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
                                                    >
                                                        Satış Yap
                                                    </button>
                                                </>
                                            )}

                                            {r.type === 'supplier' && (
                                                <>
                                                    <button
                                                        onClick={() => handleNavigate(r.link)}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all"
                                                    >
                                                        Tedarikçi Kartı
                                                    </button>
                                                    <button
                                                        onClick={() => handleTradeAction({ id: r.id, company_name: r.title }, 'purchase')}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all"
                                                    >
                                                        Alım Yap
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center space-y-4">
                                <div className="text-gray-400 italic text-sm">
                                    🔍 Aranan kriterlere uygun sonuç bulunamadı.
                                </div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setShowQuickCreate(true);
                                    }}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    ✨ Yeni Kayıt Oluştur
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showQuickCreate && (
                <Portal>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-hide">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                        ✨ Yeni Kayıt
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-1">Oluşturmak istediğiniz veri tipini seçin.</p>
                                </div>
                                <button onClick={() => setShowQuickCreate(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">✕</button>
                            </div>

                            <div className="p-8 grid grid-cols-1 gap-3 flex-1 overflow-y-auto">
                                {quickOptions.map(opt => (
                                    <button
                                        key={opt.type}
                                        onClick={() => handleNavigate(opt.link)}
                                        className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/30 hover:bg-indigo-50 hover:border-indigo-100 transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{opt.label}</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistem Kaydı Ekle</div>
                                        </div>
                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 font-bold">
                                            →
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-8 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10 backdrop-blur-md">
                                <button
                                    onClick={() => setShowQuickCreate(false)}
                                    className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-gray-900 transition-all"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {tradeConfig && (
                <TradeDialog
                    contact={tradeConfig.contact}
                    type={tradeConfig.type}
                    onClose={() => setTradeConfig(null)}
                    onSuccess={() => {
                        setTradeConfig(null);
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
