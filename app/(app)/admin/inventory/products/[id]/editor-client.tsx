'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProduct, deleteProduct } from '@/app/actions/inventory';
import { createPrice, updateStock } from '@/app/actions/commerce';
import { uploadProductImage, deleteStorageObject } from '@/app/actions/storage';
import { Product, ProductCategory, Price, InventoryItem, ProductVariant } from '@/types';
import { generateBarcode } from '@/lib/barcode';
import Link from 'next/link';
import { generateSlug } from '@/lib/slug';
import { useEffect } from 'react';

interface Props {
    initialData: Product | null;
    categories: ProductCategory[];
    initialPrices: Price[];
    initialStock: InventoryItem[];
}

// Helper Component for Comma Styling & Focus Persistence
const AttributeRow = ({ attr, idx, onUpdate, onRemove }: any) => {
    // We use a local state for the text input to allow typing commas without immediate parent re-renders 
    // that would strip trailing commas or jump focus.
    const [inputValue, setInputValue] = useState(attr.options.join(', '));

    return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex gap-4 items-start">
            <div className="flex-1">
                <input
                    type="text"
                    value={attr.name || ''}
                    onChange={e => onUpdate(idx, { ...attr, name: e.target.value })}
                    placeholder="Örn: Renk"
                    className="w-full bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none pb-1 text-sm font-medium"
                />
            </div>
            <div className="flex-[3]">
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value);
                        const options = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                        onUpdate(idx, { ...attr, options });
                    }}
                    placeholder="Örn: Kırmızı, Mavi (Virgülle ayırın)"
                    className="w-full bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none pb-1 text-sm"
                />
            </div>
            <button
                onClick={() => onRemove(idx)}
                className="text-gray-300 hover:text-red-500 transition-colors pt-1"
            >
                ✕
            </button>
        </div>
    );
};

export default function ProductEditorClient({ initialData, categories, initialPrices, initialStock }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Partial<Product>>(() => {
        if (!initialData) return ({
            type: 'product',
            title: '',
            sku: '',
            is_active: true,
            images: [],
            locales: {},
            slug: '',
            category_id: null,
            allow_sale: true,
            allow_purchase: true,
            allow_consumable: false,
            is_ecommerce_active: false,
            metadata: { attributes_config: [] }
        } as Partial<Product>);

        // Map inventory to initial_stock for variants
        return {
            ...initialData,
            variants: initialData.variants?.map(v => ({
                ...v,
                initial_stock: v.inventory?.[0]?.state ? (v.inventory[0].state as any).on_hand : 0
            }))
        };
    });

    const [attributes, setAttributes] = useState<any[]>(product.metadata?.attributes_config || []);
    const [digitalMeta, setDigitalMeta] = useState<any>(product.digital_meta || {
        access_rules: {}
    });

    const isNew = !initialData;


    // Auto-slug and barcode generation for new products
    useEffect(() => {
        if (isNew && product.title) {
            setProduct(prev => {
                const hasVariants = prev.variants && prev.variants.length > 0;
                return {
                    ...prev,
                    slug: generateSlug(prev.title || ''),
                    barcode: hasVariants ? null : (prev.barcode || generateBarcode())
                };
            });
        }
    }, [product.title, isNew, product.variants?.length]);

    const [price, setPrice] = useState(
        (initialPrices.find(p => p.list_key === 'standard' && p.currency === 'TRY')
            || initialPrices.find(p => p.list_key === 'standard'))?.amount?.toString() || ''
    );
    const [purchasePrice, setPurchasePrice] = useState(
        (initialPrices.find(p => p.list_key === 'purchase' && p.currency === 'TRY')
            || initialPrices.find(p => p.list_key === 'purchase'))?.amount?.toString() || ''
    );
    const [stock, setStock] = useState(initialStock[0]?.state ? (initialStock[0].state as any).on_hand?.toString() : '0');

    // Sync global stock with variants if they exist
    useEffect(() => {
        if (product.variants && product.variants.length > 0) {
            const total = product.variants.reduce((acc, v) => acc + (v.initial_stock || 0), 0);
            setStock(total.toString());
        }
    }, [product.variants]);

    const generateVariants = () => {
        if (attributes.length === 0) return;

        // Cartesian product of attributes
        const combinations = attributes.reduce((acc: any[], attr: any) => {
            if (attr.options.length === 0) return acc;
            if (acc.length === 0) return attr.options.map((opt: string) => ({ [attr.name]: opt }));

            const nextAcc: any[] = [];
            acc.forEach((combo: any) => {
                attr.options.forEach((opt: string) => {
                    nextAcc.push({ ...combo, [attr.name]: opt });
                });
            });
            return nextAcc;
        }, [] as any[]);

        const existingVariants = product.variants || [];

        const newVariants = combinations.map((combo: any) => {
            const variantAttributes = combo as Record<string, string>;
            const title = `${product.title} - ${Object.values(variantAttributes).join(' - ')}`;
            const sku = `${product.sku}-${Object.values(variantAttributes).join('-').toUpperCase()}`;

            // Try to find if this combination already existed to preserve ID, price and stock
            const existing = existingVariants.find(v => {
                const vAttrs = v.attributes as Record<string, string>;
                if (Object.keys(vAttrs).length !== Object.keys(variantAttributes).length) return false;
                return Object.entries(variantAttributes).every(([k, val]) => vAttrs[k] === val);
            });

            if (existing) {
                return {
                    ...existing,
                    title, // Refresh title in case product title changed
                    sku,   // Refresh SKU in case product SKU changed
                };
            }

            return {
                title,
                sku,
                attributes: variantAttributes,
                is_active: true,
                image_url: null,
                barcode: generateBarcode()
            };
        });

        setProduct(prev => ({
            ...prev,
            variants: newVariants,
            barcode: null // Clear main barcode if variants exist
        }));
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !product.id) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadProductImage(product.id, formData, 'cover');
        if (result.success) {
            setProduct(prev => ({
                ...prev,
                cover_image: result.url,
                cover_thumb: result.thumbUrl
            }));
        } else {
            alert(result.error);
        }
        setLoading(false);
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !product.id) return;

        setLoading(true);
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);
            const result = await uploadProductImage(product.id, formData, 'gallery');
            if (result.success) {
                setProduct(prev => ({
                    ...prev,
                    images: [...(prev.images || []), result.url]
                }));
            }
        }
        setLoading(false);
    };

    const handleVariantImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !product.id) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        const variant = (product.variants || [])[idx];
        const result = await uploadProductImage(product.id, formData, 'variant', variant.id);

        if (result.success) {
            const newVariants = [...(product.variants || [])];
            newVariants[idx].image_url = result.url;
            setProduct({ ...product, variants: newVariants });
        } else {
            alert(result.error);
        }
        setLoading(false);
    };

    function renderCategoryTree(parentId: string | null = null, depth = 0) {
        return categories
            .filter(c => c.parent_id === parentId)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(cat => (
                <div key={cat.id}>
                    <label
                        className="flex items-center gap-2 py-1 px-2 hover:bg-white rounded transition-colors cursor-pointer"
                        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
                    >
                        <input
                            type="checkbox"
                            checked={product.category_ids?.includes(cat.id)}
                            onChange={e => {
                                const checked = e.target.checked;
                                let currentIds = [...(product.category_ids || [])];

                                if (checked) {
                                    // 1. Add current category
                                    if (!currentIds.includes(cat.id)) currentIds.push(cat.id);

                                    // 2. Add all parents recursively
                                    const addParents = (id: string) => {
                                        const category = categories.find(c => c.id === id);
                                        if (category?.parent_id) {
                                            if (!currentIds.includes(category.parent_id)) {
                                                currentIds.push(category.parent_id);
                                            }
                                            addParents(category.parent_id);
                                        }
                                    };
                                    addParents(cat.id);
                                } else {
                                    // 1. Remove current category
                                    currentIds = currentIds.filter(id => id !== cat.id);

                                    // 2. Remove all descendants recursively
                                    const removeDescendants = (parentId: string) => {
                                        const children = categories.filter(c => c.parent_id === parentId);
                                        children.forEach(child => {
                                            currentIds = currentIds.filter(id => id !== child.id);
                                            removeDescendants(child.id);
                                        });
                                    };
                                    removeDescendants(cat.id);
                                }

                                setProduct({ ...product, category_ids: currentIds });
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                    {renderCategoryTree(cat.id, depth + 1)}
                </div>
            ));
    }

    async function handleSave() {
        setLoading(true);
        try {
            const productToSave = {
                ...product,
                metadata: {
                    ...product.metadata,
                    attributes_config: attributes
                },
                variants: product.variants?.map(v => {
                    const { ...vData } = v;
                    if (!vData.id) delete vData.id;
                    return vData;
                }),
                digital_meta: product.metadata?.is_digital ? digitalMeta : null
            };


            // 1. Save Product Content
            const result = await saveProduct(productToSave);
            if (!result.success || !result.data) throw new Error(result.error || 'Kaydedilirken hata oluştu.');

            const savedProduct = result.data;
            const finalSku = savedProduct.sku;

            // 2. Save Price (linking by SKU)
            if (price) {
                const priceFormData = new FormData();
                priceFormData.append('sku', finalSku);
                priceFormData.append('amount', price);
                priceFormData.append('list_key', 'standard');
                priceFormData.append('currency', 'TRY');
                const res = await createPrice(priceFormData);
                if (res.error) console.error('Standard price save error:', res.error);
            }

            // 2.1 Save Purchase Price
            if (purchasePrice) {
                const purchasePriceFormData = new FormData();
                purchasePriceFormData.append('sku', finalSku);
                purchasePriceFormData.append('amount', purchasePrice);
                purchasePriceFormData.append('list_key', 'purchase');
                purchasePriceFormData.append('currency', 'TRY');
                const res = await createPrice(purchasePriceFormData);
                if (res.error) console.error('Purchase price save error:', res.error);
            }

            // 3. Save Stock (if product type)
            if (product.type === 'product' && stock) {
                await updateStock(finalSku, parseInt(stock));
            }

            // 4. Save Variant Stocks
            if (productToSave.variants && savedProduct?.variants) {
                for (const variant of productToSave.variants) {
                    if (variant.initial_stock !== undefined) {
                        // Find the saved variant to get its real database ID
                        const dbVariant = savedProduct.variants.find((v: any) => v.sku === variant.sku);
                        if (dbVariant) {
                            await updateStock(variant.sku, variant.initial_stock, dbVariant.id);
                        }
                    }
                }
            }

            router.push('/admin/inventory/products');
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/inventory/products" className="text-gray-400 hover:text-gray-600">← Geri</Link>
                <h1 className="text-2xl font-bold text-gray-900">
                    {initialData ? 'Düzenle: ' + initialData.title : 'Yeni Ürün/Hizmet Ekle'}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">İsim / Başlık</label>
                            <input
                                type="text"
                                value={product.title || ''}
                                onChange={e => setProduct({ ...product, title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Örn: iPhone 15 Pro"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">Slug / URL Yolu</label>
                            <div className="flex items-center">
                                <span className="bg-gray-50 border border-r-0 border-gray-200 px-3 py-2 rounded-l-lg text-gray-400 text-sm font-mono">
                                    /products/
                                </span>
                                <input
                                    type="text"
                                    value={product.slug || ''}
                                    onChange={e => setProduct({ ...product, slug: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                    placeholder="iphone-15-pro"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Web sitesindeki ürün sayfası bu isimle görünecektir.</p>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">Açıklama</label>
                            <textarea
                                value={product.description || ''}
                                onChange={e => setProduct({ ...product, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32"
                                placeholder="Ürün veya hizmet hakkında kısa bilgi..."
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase">Varyasyonlar</h3>
                            <button
                                onClick={() => setAttributes([...attributes, { name: '', options: [] }])}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                            >
                                + Özellik Ekle
                            </button>
                        </div>

                        {attributes.length > 0 && (
                            <div className="space-y-4 mb-8">
                                {attributes.map((attr, idx) => (
                                    <AttributeRow
                                        key={idx}
                                        attr={attr}
                                        idx={idx}
                                        onUpdate={(i: number, updated: any) => {
                                            const next = [...attributes];
                                            next[i] = updated;
                                            setAttributes(next);
                                        }}
                                        onRemove={(i: number) => setAttributes(attributes.filter((_, idx) => idx !== i))}
                                    />
                                ))}

                                <button
                                    onClick={generateVariants}
                                    className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all uppercase tracking-wider"
                                >
                                    Varyasyonları Oluştur ({attributes.reduce((acc, a) => acc * (a.options.length || 1), 1)} Kombinasyon)
                                </button>
                            </div>
                        )}

                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-3">
                                {product.variants.map((variant: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:border-indigo-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <label
                                                    className={`relative cursor-pointer w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden transition-all shrink-0 ${!variant.id ? 'opacity-50 grayscale cursor-not-allowed bg-gray-50' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                    title={!variant.id ? "Fotoğraf yüklemek için önce ürünü kaydedin" : "Varyasyon fotoğrafı yükle"}
                                                >
                                                    {variant.image_url ? (
                                                        <img src={variant.image_url} alt="Variant" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm text-gray-400">📸</span>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => handleVariantImageUpload(idx, e)}
                                                        accept="image/*"
                                                        disabled={!variant.id}
                                                    />
                                                </label>
                                                {variant.image_url && (
                                                    <button
                                                        onClick={() => {
                                                            const newVariants = [...(product.variants || [])];
                                                            newVariants[idx].image_url = null;
                                                            setProduct({ ...product, variants: newVariants });
                                                        }}
                                                        className="absolute -top-1 -right-1 bg-white border border-gray-200 text-red-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm hover:bg-red-50 transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-semibold text-gray-800 line-clamp-1 block leading-tight mb-1">{variant.title}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center bg-white border border-gray-200 rounded px-1.5 py-0.5 gap-1.5">
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase">Barkod</span>
                                                        <input
                                                            type="text"
                                                            value={variant.barcode || ''}
                                                            onChange={e => {
                                                                const newVariants = [...(product.variants || [])];
                                                                newVariants[idx].barcode = e.target.value;
                                                                setProduct({ ...product, variants: newVariants });
                                                            }}
                                                            className="text-[10px] font-mono outline-none w-24 bg-transparent"
                                                            placeholder="Barkod yok"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newVariants = [...(product.variants || [])];
                                                                newVariants[idx].barcode = generateBarcode();
                                                                setProduct({ ...product, variants: newVariants });
                                                            }}
                                                            className="text-[9px] text-indigo-500 hover:text-indigo-700 font-bold"
                                                            title="Barkod Oluştur"
                                                        >
                                                            ⚡
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-mono italic">{variant.sku}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                                                <span className="text-[10px] text-gray-400 font-bold mr-2 uppercase">Fiyat</span>
                                                <input
                                                    type="number"
                                                    value={variant.price || ''}
                                                    onChange={e => {
                                                        const newVariants = [...(product.variants || [])];
                                                        newVariants[idx].price = parseFloat(e.target.value) || undefined;
                                                        setProduct({ ...product, variants: newVariants });
                                                    }}
                                                    className="w-16 bg-transparent outline-none text-xs font-bold"
                                                    placeholder="Opsiyonel"
                                                />
                                            </div>
                                            <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                                                <span className="text-[10px] text-gray-400 font-bold mr-2 uppercase">Stok</span>
                                                <input
                                                    type="number"
                                                    value={variant.initial_stock || ''}
                                                    onChange={e => {
                                                        const newVariants = [...(product.variants || [])];
                                                        newVariants[idx].initial_stock = parseInt(e.target.value) || 0;
                                                        setProduct({ ...product, variants: newVariants });
                                                    }}
                                                    className="w-12 bg-transparent outline-none text-xs font-bold"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newVariants = [...(product.variants || [])];
                                                    newVariants.splice(idx, 1);
                                                    setProduct({ ...product, variants: newVariants });
                                                }}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {product.metadata?.is_digital && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase">Dijital Ürün Ayarları</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">Dosya URL / İndirme Linki</label>
                                    <input
                                        type="text"
                                        value={digitalMeta.file_url || ''}
                                        onChange={e => setDigitalMeta({ ...digitalMeta, file_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                        placeholder="https://example.com/file.zip"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">İndirme Limiti</label>
                                    <input
                                        type="number"
                                        value={digitalMeta.download_limit || ''}
                                        onChange={e => setDigitalMeta({ ...digitalMeta, download_limit: parseInt(e.target.value) || undefined })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none text-sm"
                                        placeholder="Sınırsız için boş bırakın"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <select
                                value={product.type}
                                onChange={e => setProduct({ ...product, type: e.target.value as 'product' | 'service' | 'consumable' })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                            >
                                <option value="product">Ürün (Physical)</option>
                                <option value="service">Hizmet (Service)</option>
                                <option value="consumable">Sarf Malzeme (Internal)</option>
                            </select>
                        </div>

                        <div className="space-y-3 pt-2">
                            {/* Products only show E-commerce toggle */}
                            {product.type === 'product' && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={product.is_ecommerce_active ?? false}
                                            onChange={e => setProduct({ ...product, is_ecommerce_active: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 uppercase group-hover:text-indigo-600 transition-colors">E-Ticaret Yayını</span>
                                </label>
                            )}

                            {/* Consumables only show 'Sellable' toggle */}
                            {product.type === 'consumable' && (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={product.allow_sale ?? false}
                                            onChange={e => setProduct({ ...product, allow_sale: e.target.checked })}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 uppercase group-hover:text-green-600 transition-colors">Satılabilir Malzeme</span>
                                </label>
                            )}
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={product.metadata?.is_digital || false}
                                    onChange={e => setProduct({
                                        ...product,
                                        metadata: { ...product.metadata, is_digital: e.target.checked }
                                    })}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Dijital Ürün</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-2">Kategoriler</label>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/30">
                                {categories.length === 0 ? (
                                    <div className="text-xs text-gray-400 italic text-center py-2">Henüz kategori eklenmemiş</div>
                                ) : (
                                    renderCategoryTree(null, 0)
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Bir ürün birden fazla kategoriye ait olabilir.</p>
                        </div>

                        {(!product.variants || product.variants.length === 0) && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs uppercase text-gray-400 font-bold">Barkod (EAN-13)</label>
                                    <button
                                        onClick={() => setProduct({ ...product, barcode: generateBarcode() })}
                                        className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold uppercase"
                                    >
                                        Yenile
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={product.barcode || ''}
                                    onChange={e => setProduct({ ...product, barcode: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none font-mono text-sm bg-gray-50/50"
                                    placeholder="Barkod numarası..."
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">SKU (Benzersiz Kod)</label>
                            <input
                                type="text"
                                value={product.sku || ''}
                                onChange={e => setProduct({ ...product, sku: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none font-mono text-sm"
                                placeholder="PROD-001"
                            />
                        </div>
                    </div>
                    {/* Content Editor */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase">Görsel ve Galeri</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Cover Image */}
                            <div className="space-y-2">
                                <label className="block text-xs uppercase text-gray-400 font-bold">Kapak Fotoğrafı</label>
                                <div className="relative group aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                                    {product.cover_image ? (
                                        <>
                                            <img src={product.cover_image} alt="Cover" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setProduct({ ...product, cover_image: undefined, cover_thumb: undefined })}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                                            >
                                                DEĞİŞTİR
                                            </button>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center">
                                            <span className="text-2xl text-gray-300">📸</span>
                                            <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">YÜKLE</span>
                                            <input type="file" className="hidden" onChange={handleCoverUpload} accept="image/*" disabled={!product.id} />
                                        </label>
                                    )}
                                </div>
                                {!product.id && <p className="text-[9px] text-orange-400 mt-1 italic">Kapak yüklemek için önce ürünü taslak olarak kaydedin.</p>}
                            </div>

                            {/* Gallery */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-xs uppercase text-gray-400 font-bold">Ürün Galerisi</label>
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {(product.images || []).map((img, i) => (
                                        <div key={i} className="relative group aspect-square bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                            <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => {
                                                    const newImages = [...(product.images || [])];
                                                    newImages.splice(i, 1);
                                                    setProduct({ ...product, images: newImages });
                                                }}
                                                className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-500 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <span className="text-xs">×</span>
                                            </button>
                                        </div>
                                    ))}
                                    <label className="cursor-pointer aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors">
                                        <span className="text-xl text-gray-300">+</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">EKLE</span>
                                        <input type="file" className="hidden" multiple onChange={handleGalleryUpload} accept="image/*" disabled={!product.id} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">Satış Fiyatı (TRY)</label>
                                <input
                                    type="number"
                                    value={price || ''}
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">Alış Fiyatı (TRY)</label>
                                <input
                                    type="number"
                                    value={purchasePrice || ''}
                                    onChange={e => setPurchasePrice(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {product.type === 'product' && (
                            <div>
                                <label className="block text-xs uppercase text-gray-400 font-bold mb-1.5">
                                    {product.variants && product.variants.length > 0 ? 'Genel Stok (Varyasyon Toplamı)' : 'Stok Miktarı'}
                                </label>
                                <input
                                    type="number"
                                    value={stock || ''}
                                    onChange={e => setStock(e.target.value)}
                                    disabled={product.variants && product.variants.length > 0}
                                    className={`w-full px-4 py-2 border rounded-lg outline-none font-bold text-lg ${product.variants && product.variants.length > 0 ? 'bg-gray-50 border-gray-100 text-indigo-600 cursor-not-allowed' : 'border-gray-200 text-gray-900 focus:border-indigo-500'}`}
                                    placeholder="0"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>

                    {initialData && (
                        <button
                            onClick={async () => {
                                if (confirm('Silmek istediğine emin misin?')) {
                                    await deleteProduct(initialData.id);
                                    router.push('/admin/inventory/products');
                                }
                            }}
                            className="w-full text-red-500 text-sm font-medium hover:text-red-600 transition-colors"
                        >
                            Ürünü Sil
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}
