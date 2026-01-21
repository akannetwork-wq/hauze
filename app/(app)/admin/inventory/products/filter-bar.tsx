'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ProductCategory } from '@/types';

interface Props {
    categories: ProductCategory[];
}

export default function ProductFilterBar({ categories }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'created_at');
    const [order, setOrder] = useState(searchParams.get('order') || 'desc');

    const updateFilters = useCallback((updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        router.push(`?${params.toString()}`);
    }, [router, searchParams]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get('q') || '')) {
                updateFilters({ q: search });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, searchParams, updateFilters]);

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[240px] relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Ürün veya Sarf Malzeme ara..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-sm"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="min-w-[180px]">
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            updateFilters({ category: e.target.value });
                        }}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-sm appearance-none cursor-pointer"
                    >
                        <option value="">Tüm Kategoriler</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id!}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => {
                            setStatus('');
                            updateFilters({ status: '' });
                        }}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${!status ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Hepsi
                    </button>
                    <button
                        onClick={() => {
                            setStatus('active');
                            updateFilters({ status: 'active' });
                        }}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${status === 'active' ? 'bg-white shadow-sm text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Aktif
                    </button>
                    <button
                        onClick={() => {
                            setStatus('passive');
                            updateFilters({ status: 'passive' });
                        }}
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-md transition-all ${status === 'passive' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Pasif
                    </button>
                </div>

                {/* Sorting */}
                <div className="flex items-center gap-2">
                    <select
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value);
                            updateFilters({ sort: e.target.value });
                        }}
                        className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none text-sm cursor-pointer"
                    >
                        <option value="created_at">Tarih</option>
                        <option value="title">İsim</option>
                        <option value="sku">SKU</option>
                    </select>
                    <button
                        onClick={() => {
                            const newOrder = order === 'asc' ? 'desc' : 'asc';
                            setOrder(newOrder);
                            updateFilters({ order: newOrder });
                        }}
                        className="p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                        title={order === 'asc' ? 'Artan' : 'Azalan'}
                    >
                        {order === 'asc' ? '🔼' : '🔽'}
                    </button>
                </div>
            </div>

            {/* Active Filters Summary */}
            {(search || category || status) && (
                <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase font-bold tracking-wider">
                    <span>Filtreler Aktif:</span>
                    <button
                        onClick={() => {
                            setSearch('');
                            setCategory('');
                            setStatus('');
                            router.push('?');
                        }}
                        className="text-indigo-600 hover:underline"
                    >
                        Tümünü Temizle
                    </button>
                </div>
            )}
        </div>
    );
}
