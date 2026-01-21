'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveCategory, deleteCategory } from '@/app/actions/inventory';
import { ProductCategory } from '@/types';
import Link from 'next/link';
import { generateSlug } from '@/lib/slug';

interface Props {
    initialData: ProductCategory | null;
    allCategories: ProductCategory[];
    type: 'product' | 'consumable' | 'service';
}

export default function CategoryEditorClient({ initialData, allCategories, type }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<Partial<ProductCategory>>(initialData || {
        name: '',
        slug: '',
        description: '',
        sort_order: 0,
        type: type
    });

    const isNew = !initialData;

    // Auto-slug generation for new categories
    useEffect(() => {
        if (isNew && category.name) {
            setCategory(prev => ({ ...prev, slug: generateSlug(prev.name || '') }));
        }
    }, [category.name, isNew]);

    async function handleSave() {
        if (!category.name || !category.slug) {
            alert('Lütfen ad ve slug alanlarını doldurun.');
            return;
        }

        setLoading(true);
        const result = await saveCategory(category);
        setLoading(false);

        if (result.success) {
            router.push(`/admin/inventory/categories?type=${category.type || type}`);
            router.refresh();
        } else {
            alert(result.error || 'Kaydedilirken bir hata oluştu.');
        }
    }

    async function handleDelete() {
        if (!initialData || !confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

        setLoading(true);
        const result = await deleteCategory(initialData.id);
        setLoading(false);

        if (result.success) {
            router.push(`/admin/inventory/categories?type=${type}`);
            router.refresh();
        } else {
            alert(result.error || 'Silinirken bir hata oluştu.');
        }
    }

    const getDescendantIds = (parentId: string): string[] => {
        const children = allCategories.filter(c => c.parent_id === parentId);
        return [...children.map(c => c.id), ...children.flatMap(c => getDescendantIds(c.id))];
    };

    const excludedIds = initialData ? [initialData.id, ...getDescendantIds(initialData.id)] : [];

    const renderOptions = (parentId: string | null = null, depth = 0): React.ReactNode[] => {
        return allCategories
            .filter(c => c.parent_id === parentId && !excludedIds.includes(c.id))
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            .flatMap(cat => [
                <option key={cat.id} value={cat.id}>
                    {'\u00A0'.repeat(depth * 3)}{depth > 0 ? '↳ ' : ''}{cat.name}
                </option>,
                ...renderOptions(cat.id, depth + 1)
            ]);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/inventory/categories" className="text-gray-400 hover:text-gray-600">
                        ←
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isNew ? 'Yeni Kategori' : 'Kategoriyi Düzenle'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Sil
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori Adı
                            </label>
                            <input
                                type="text"
                                value={category.name || ''}
                                onChange={e => setCategory({ ...category, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Örn: Elektronik"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Slug
                            </label>
                            <div className="flex items-center">
                                <span className="bg-gray-50 border border-r-0 border-gray-200 px-3 py-2 rounded-l-lg text-gray-400 text-sm">
                                    /
                                </span>
                                <input
                                    type="text"
                                    value={category.slug || ''}
                                    onChange={e => setCategory({ ...category, slug: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    placeholder="elektronik"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Açıklama
                            </label>
                            <textarea
                                value={category.description || ''}
                                onChange={e => setCategory({ ...category, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                                placeholder="Kategori hakkında kısa bir bilgi..."
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Üst Kategori
                            </label>
                            <select
                                value={category.parent_id || ''}
                                onChange={e => setCategory({ ...category, parent_id: e.target.value || null })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">(Yok - Ana Kategori)</option>
                                {renderOptions()}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sıralama
                            </label>
                            <input
                                type="number"
                                value={category.sort_order || 0}
                                onChange={e => setCategory({ ...category, sort_order: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
