'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProduct, deleteProduct } from '@/app/actions/inventory';
import { createPrice } from '@/app/actions/commerce';
import { Product, ProductCategory } from '@/types';
import Link from 'next/link';
import {
    CpuChipIcon,
    PlusIcon,
    TrashIcon,
    BoltIcon,
    VariableIcon,
    Square3Stack3DIcon
} from '@heroicons/react/24/solid';

interface Props {
    initialData: Product | null;
    categories: ProductCategory[];
}

export default function ServiceEditorClient({ initialData, categories }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [service, setService] = useState<Partial<Product>>(() => {
        if (!initialData) return ({
            type: 'service',
            title: '',
            sku: '',
            is_active: true,
            service_config: { inputs: [], rules: [] }
        } as Partial<Product>);

        return {
            ...initialData,
            service_config: initialData.service_config || { inputs: [], rules: [] }
        };
    });

    const [price, setPrice] = useState(() => {
        if (!initialData?.prices) return '0';
        const stdPrice = initialData.prices.find(p => p.list_key === 'standard' && p.currency === 'TRY')
            || initialData.prices.find(p => p.list_key === 'standard');
        return stdPrice?.amount?.toString() || '0';
    });

    const inputs = service.service_config?.inputs || [];
    const rules = service.service_config?.rules || [];

    const addInput = () => {
        const newInput = { id: Math.random().toString(36).substr(2, 9), label: 'Yeni Alan', type: 'number', placeholder: '0' };
        const currentConfig = service.service_config || { inputs: [], rules: [] };
        setService({
            ...service,
            service_config: {
                ...currentConfig,
                inputs: [...(currentConfig.inputs || []), newInput]
            }
        });
    };

    const addRule = () => {
        const currentConfig = service.service_config || { inputs: [], rules: [] };
        const newRule = { id: Math.random().toString(36).substr(2, 9), fieldId: currentConfig.inputs?.[0]?.id || '', operation: 'add', value: 0 };
        setService({
            ...service,
            service_config: {
                ...currentConfig,
                rules: [...(currentConfig.rules || []), newRule]
            }
        });
    };

    async function handleSave() {
        setLoading(true);
        try {
            // Cleanup empty options or stray commas
            const cleanInputs = (service.service_config?.inputs || []).map((inp: any) => ({
                ...inp,
                options: inp.options?.filter(Boolean).map((o: string) => o.trim()) || []
            }));

            const cleanRules = (service.service_config?.rules || []).map((rule: any) => {
                const input = cleanInputs.find((i: any) => i.id === rule.fieldId);
                const { matchValue, ...rest } = rule;
                return input?.type === 'select' ? rule : rest;
            });

            const cleanService = {
                ...service,
                service_config: {
                    ...service.service_config,
                    inputs: cleanInputs,
                    rules: cleanRules
                }
            };

            const result = await saveProduct(cleanService);
            if (!result.success || !result.data) throw new Error(result.error);

            // Handle Base Price
            if (price) {
                const formData = new FormData();
                formData.append('sku', result.data.sku);
                formData.append('amount', price);
                formData.append('list_key', 'standard');
                formData.append('currency', 'TRY');
                await createPrice(formData);
            }

            router.push('/admin/inventory/services');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link href="/admin/inventory/services" className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">←</Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tightest uppercase">{initialData ? 'Hizmet Yapılandır' : 'Yeni Hizmet Oluştur'}</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Akıllı Fiyatlandırma ve Seçenekler</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-10 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'KAYDEDİLİYOR...' : 'YAPILANDIRMAYI KAYDET'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: General Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CpuChipIcon className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-gray-900 text-sm uppercase">Temel Bilgiler</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Hizmet Adı</label>
                                <input
                                    type="text"
                                    value={service.title || ''}
                                    onChange={e => setService({ ...service, title: e.target.value })}
                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                                    placeholder="Örn: Ev Temizliği (Standart)"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Baz Birim Fiyat (₺)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={price}
                                    onChange={e => setPrice(Math.max(0, parseFloat(e.target.value) || 0).toString())}
                                    className="w-full px-5 py-4 bg-emerald-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-700 text-xl transition-all"
                                    placeholder="0.00"
                                />
                                <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium italic">Hiçbir ek seçenek seçilmediğinde geçerli olan temel fiyattır.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <TrashIcon className="w-5 h-5 text-rose-500" />
                            <h3 className="font-bold text-gray-900 text-sm uppercase">Yönetim</h3>
                        </div>
                        <button
                            className="w-full py-4 text-center text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all"
                            onClick={() => { if (confirm('Emin misiniz?')) deleteProduct(initialData!.id).then(() => router.push('/admin/inventory/services')) }}
                        >
                            Hizmeti Kalıcı Olarak Sil
                        </button>
                    </div>
                </div>

                {/* Right: Smart Config */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Dynamic Inputs */}
                    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <VariableIcon className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-gray-900 text-sm uppercase">Sipariş Formu Alanları & Fiyatlandırma</h3>
                            </div>
                            <button
                                onClick={addInput}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all"
                            >
                                + ALAN EKLE
                            </button>
                        </div>

                        <div className="space-y-6">
                            {inputs.map((input: any, idx: number) => {
                                // Find rules related to this field
                                const fieldRules = rules.filter((r: any) => r.fieldId === input.id);

                                const updateRule = (matchValue: string | null, value: number, operation: string = 'fixed_add') => {
                                    const nextRules = [...rules];
                                    const ruleIdx = nextRules.findIndex((r: any) => r.fieldId === input.id && (matchValue ? r.matchValue === matchValue : !r.matchValue));

                                    if (ruleIdx > -1) {
                                        if (value === 0) {
                                            nextRules.splice(ruleIdx, 1);
                                        } else {
                                            nextRules[ruleIdx] = { ...nextRules[ruleIdx], value, operation };
                                        }
                                    } else if (value !== 0) {
                                        nextRules.push({
                                            id: Math.random().toString(36).substr(2, 9),
                                            fieldId: input.id,
                                            matchValue: matchValue || undefined,
                                            operation,
                                            value
                                        });
                                    }
                                    setService({ ...service, service_config: { ...service.service_config, rules: nextRules } });
                                };

                                return (
                                    <div key={input.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6 relative group border-l-8 border-l-indigo-500">
                                        <button
                                            onClick={() => {
                                                const next = [...inputs];
                                                next.splice(idx, 1);
                                                const nextRules = rules.filter((r: any) => r.fieldId !== input.id);
                                                setService({ ...service, service_config: { ...service.service_config, inputs: next, rules: nextRules } });
                                            }}
                                            className="absolute top-6 right-8 text-gray-300 hover:text-rose-500 transition-all font-black text-xs"
                                        >
                                            ALANI SİL ✕
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Alan Etiketi (Kullanıcıya Görünecek)</label>
                                                <input
                                                    type="text"
                                                    value={input.label}
                                                    onChange={e => {
                                                        const next = [...inputs];
                                                        next[idx].label = e.target.value;
                                                        setService({ ...service, service_config: { ...service.service_config, inputs: next } });
                                                    }}
                                                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 font-black text-sm outline-none focus:border-indigo-500 transition-all"
                                                    placeholder="Örn: Tezgah Tipi"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Veri Tipi</label>
                                                <select
                                                    value={input.type}
                                                    onChange={e => {
                                                        const next = [...inputs];
                                                        next[idx].type = e.target.value;
                                                        setService({ ...service, service_config: { ...service.service_config, inputs: next } });
                                                    }}
                                                    className="w-full bg-white border-2 border-gray-100 rounded-2xl px-5 py-3 font-black text-xs outline-none"
                                                >
                                                    <option value="number">Sayı (Adet, m², Saat vb.)</option>
                                                    <option value="toggle">Seçim (Evet/Hayır)</option>
                                                    <option value="select">Açılır Liste (Varyasyonlar)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Setup Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200/50">
                                            {/* Left: Input Specific Config */}
                                            <div className="space-y-4">
                                                {input.type === 'number' && (
                                                    <div>
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Birim</label>
                                                        <input
                                                            type="text"
                                                            value={input.unit || ''}
                                                            onChange={e => {
                                                                const next = [...inputs];
                                                                next[idx].unit = e.target.value;
                                                                setService({ ...service, service_config: { ...service.service_config, inputs: next } });
                                                            }}
                                                            className="w-full bg-white border-none rounded-xl px-4 py-2 font-bold text-xs outline-none shadow-sm"
                                                            placeholder="m², Adet vb."
                                                        />
                                                    </div>
                                                )}

                                                {input.type === 'select' && (
                                                    <div>
                                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Seçenek Listesi (Virgülle Ayırın)</label>
                                                        <input
                                                            type="text"
                                                            value={input.options?.join(', ') || ''}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                const next = [...inputs];
                                                                next[idx].options = val.split(',').map(s => s.trim());
                                                                setService({ ...service, service_config: { ...service.service_config, inputs: next } });
                                                            }}
                                                            className="w-full bg-indigo-50/50 border-2 border-indigo-100 rounded-xl px-4 py-2 font-bold text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                                            placeholder="Küçük, Orta, Büyük"
                                                        />
                                                    </div>
                                                )}

                                                {input.type === 'toggle' && (
                                                    <div className="py-4 px-6 bg-white rounded-2xl border-2 border-emerald-100">
                                                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Toggle Aktif Olduğunda</p>
                                                        <p className="text-xs text-gray-400 mt-1">Bu seçenek seçildiğinde fiyata ne ekleneceğini sağdan belirleyin.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Pricing Logic (The User Example) */}
                                            <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Fiyatlandırma Etkisi</h4>
                                                    <select
                                                        className="text-[9px] font-black uppercase bg-gray-100 border-none rounded-lg px-2 py-1 outline-none"
                                                        value={fieldRules[0]?.operation || 'fixed_add'}
                                                        onChange={(e) => {
                                                            const op = e.target.value;
                                                            const nextRules = rules.map((r: any) => r.fieldId === input.id ? { ...r, operation: op } : r);
                                                            setService({ ...service, service_config: { ...service.service_config, rules: nextRules } });
                                                        }}
                                                    >
                                                        <option value="fixed_add">Sabit Ücret (+₺)</option>
                                                        <option value="multiply">Katsayı (x)</option>
                                                        {input.type === 'number' && <option value="add">Birim Başına (+₺)</option>}
                                                    </select>
                                                </div>

                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                    {input.type === 'select' ? (
                                                        (input.options || []).filter(Boolean).map((opt: string) => {
                                                            const r = fieldRules.find((rule: any) => rule.matchValue === opt);
                                                            return (
                                                                <div key={opt} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                                                    <div className="flex-1 text-[10px] font-black text-gray-500 uppercase truncate">{opt}</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[10px] font-bold text-gray-400">=</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={r?.value || 0}
                                                                            onChange={e => updateRule(opt, Math.max(0, parseFloat(e.target.value) || 0), fieldRules[0]?.operation || 'fixed_add')}
                                                                            className="w-20 bg-white border-2 border-gray-100 rounded-lg px-2 py-1 font-black text-xs text-right outline-none focus:border-indigo-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl">
                                                            <div className="flex-1 text-[10px] font-black text-indigo-600 uppercase">Tutar / Değer</div>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={fieldRules[0]?.value || 0}
                                                                onChange={e => updateRule(null, Math.max(0, parseFloat(e.target.value) || 0), fieldRules[0]?.operation || (input.type === 'number' ? 'add' : 'fixed_add'))}
                                                                className="w-24 bg-white border-2 border-indigo-200 rounded-xl px-3 py-2 font-black text-sm text-right outline-none focus:border-indigo-500"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {inputs.length === 0 && (
                            <div className="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                                <PlusIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Henüz bir seçenek eklenmedi</p>
                                <p className="text-gray-400 text-[10px] mt-2 italic font-medium">Hizmetin fiyatını etkileyecek değişkenleri (örn: oda sayısı, malzeme tipi) buradan ekleyin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
