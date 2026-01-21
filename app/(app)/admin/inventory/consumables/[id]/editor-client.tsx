'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductCategory } from '@/types';
import { saveProduct } from '@/app/actions/inventory';
import { updateStock, createPrice } from '@/app/actions/commerce';
import { generateSlug } from '@/lib/slug';
import { uploadProductImage } from '@/app/actions/storage';
import { useEffect } from 'react';

interface Props {
    initialData: Product | null;
    categories: ProductCategory[];
    initialPrices: any[];
    initialStock: any[];
}

const UNITS = [
    { label: 'Adet', value: 'adet' },
    { label: 'Kilogram (kg)', value: 'kg' },
    { label: 'Ton (t)', value: 'ton' },
    { label: 'Metre (m)', value: 'm' },
    { label: 'Metrekare (m2)', value: 'm2' },
    { label: 'Metreküp (m3)', value: 'm3' },
    { label: 'Tabaka', value: 'tabaka' },
    { label: 'Litre (L)', value: 'L' },
    { label: 'Paket', value: 'paket' },
];

export default function ConsumableEditorClient({ initialData, categories, initialPrices, initialStock }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Partial<Product>>(initialData || {
        type: 'consumable',
        title: '',
        sku: '',
        slug: '',
        description: '',
        content: '',
        unit: 'adet',
        is_active: true,
        images: [],
        category_ids: []
    });

    const isNew = !initialData;

    // Auto-slug generation
    useEffect(() => {
        if (isNew && product.title && !product.slug) {
            setProduct(prev => ({ ...prev, slug: generateSlug(prev.title || '') }));
        }
    }, [product.title, isNew]);

    const [price, setPrice] = useState(initialPrices[0]?.amount?.toString() || '');
    const [stock, setStock] = useState(initialStock[0]?.state ? (initialStock[0].state as any).on_hand?.toString() : '0');

    async function handleSave() {
        setLoading(true);
        try {
            // 1. Save Base Data
            const { success, data: savedProductData, error: saveError } = await saveProduct({
                ...product as Product,
                type: 'consumable'
            });

            if (!success || !savedProductData) {
                throw new Error(saveError || 'Kaydedilirken bir hata oluştu.');
            }

            const finalSku = savedProductData.sku;

            // 2. Save Price & Stock if changed
            if (price) {
                const priceData = new FormData();
                priceData.append('sku', finalSku);
                priceData.append('amount', price);
                priceData.append('currency', 'TRY');
                await createPrice(priceData);
            }

            if (stock) {
                await updateStock(finalSku, parseFloat(stock));
            }

            router.push('/admin/inventory/consumables');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadProductImage(product.id!, formData);
            if (result.error) throw new Error(result.error);

            setProduct(prev => ({
                ...prev,
                cover_image: result.url,
                cover_thumb: result.thumbUrl
            }));
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">←</button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isNew ? 'Yeni Sarf Malzeme' : 'Malzeme Düzenle'}
                        </h1>
                        <p className="text-sm text-gray-500">Üretim hammadde ve materyal yönetimi.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">📝</span>
                            <h2 className="font-bold text-gray-900">Genel Bilgiler</h2>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5 ml-1">Malzeme Adı</label>
                            <input
                                type="text"
                                value={product.title}
                                onChange={e => setProduct({ ...product, title: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-amber-500 transition-colors"
                                placeholder="Örn: MDF Tabaka 18mm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5 ml-1">SKU / Stok Kodu</label>
                                <input
                                    type="text"
                                    value={product.sku}
                                    onChange={e => setProduct({ ...product, sku: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-amber-500 transition-colors font-mono"
                                    placeholder="MDF-18-STD"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5 ml-1">Birim</label>
                                <select
                                    value={product.unit || 'adet'}
                                    onChange={e => setProduct({ ...product, unit: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                                >
                                    {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5 ml-1">Kısa Açıklama</label>
                            <textarea
                                value={product.description || ''}
                                onChange={e => setProduct({ ...product, description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-amber-500 transition-colors h-24 resize-none"
                                placeholder="Malzeme hakkında kısa bilgi..."
                            />
                        </div>
                    </div>

                    {/* Stock & Cost */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">⚖️</span>
                            <h2 className="font-bold text-gray-900">Stok ve Maliyet</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5 ml-1 text-emerald-600">Birim Maliyet (Alış)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₺</span>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5 ml-1 text-indigo-600">Güncel Stok</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={e => setStock(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-indigo-50/30 border border-indigo-100 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-400 uppercase">{product.unit || 'adet'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Support */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">📸</span>
                            <h2 className="font-bold text-gray-900">Görsel</h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group">
                                {product.cover_image ? (
                                    <>
                                        <img src={product.cover_image} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setProduct({ ...product, cover_image: null, cover_thumb: null })}
                                            className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            Kaldır
                                        </button>
                                    </>
                                ) : (
                                    <label className="inset-0 absolute flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                                        <span className="text-2xl mb-1">📸</span>
                                        <span className="text-[10px] uppercase font-bold text-gray-400">Yükle</span>
                                        <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/*" />
                                    </label>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-700 mb-1">Malzeme Fotoğrafı</p>
                                <p className="text-xs text-gray-500">Mümkünse temiz, beyaz zeminli bir hammadde fotoğrafı yükleyin. Bu, depo yönetiminde görsel tanımayı kolaylaştırır.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Satılabilir Malzeme</p>
                                <p className="text-[10px] text-gray-500">Satış faturası ve siparişlerde seçilebilir.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={product.allow_sale || false}
                                onChange={e => setProduct({ ...product, allow_sale: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                        </label>

                        <div className="border-t border-gray-100 my-2"></div>

                        <label className="flex items-center justify-between cursor-pointer group">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Aktif Kullanım</p>
                                <p className="text-[10px] text-gray-500">Üretim formlarında seçilebilir.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={product.is_active}
                                onChange={e => setProduct({ ...product, is_active: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            />
                        </label>
                    </div>

                    {/* Category Selection */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-xs uppercase text-gray-400 font-bold mb-2">Kategoriler</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map((cat) => (
                                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={product.category_ids?.includes(cat.id!)}
                                        onChange={e => {
                                            const newIds = e.target.checked
                                                ? [...(product.category_ids || []), cat.id!]
                                                : (product.category_ids || []).filter(id => id !== cat.id);
                                            setProduct({ ...product, category_ids: newIds });
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
