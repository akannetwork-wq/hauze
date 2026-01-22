import Link from 'next/link';
import { getInventorySummary } from '@/app/actions/inventory';
import { headers } from 'next/headers';

export default async function InventoryDashboard() {
    await headers();
    const stats = await getInventorySummary();

    return (
        <div className="p-8 font-sans max-w-[1600px] mx-auto">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Envanter Dashboard</h1>
                <p className="text-gray-500 mt-2 text-lg">Tüm operasyonel kalemlerinizi tek ekrandan yönetin.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 📦 ÜRÜNLER (Products) */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full border-t-4 border-t-indigo-500">
                        <div className="p-8 pb-4">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                                    📦
                                </div>
                                {stats.products.lowStock > 0 && (
                                    <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold border border-rose-100 animate-pulse">
                                        ⚠️ {stats.products.lowStock} Azalan Stok
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Ürünler</h2>
                            <p className="text-gray-500 text-sm mt-2 leading-relaxed h-10">
                                * Satışa hazır mamuller, mobilyalar ve varyasyonlu ürünler.
                            </p>
                            <div className="mt-8 flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900">{stats.products.total}</span>
                                <span className="text-gray-400 font-medium text-sm uppercase tracking-widest">Kayıtlı Ürün</span>
                            </div>
                        </div>

                        <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-2">
                            <Link
                                href="/admin/inventory/products"
                                className="w-full bg-white border border-gray-200 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-center text-sm shadow-sm"
                            >
                                Ürün Yönetimi
                            </Link>
                            <Link
                                href="/admin/inventory/categories?type=product"
                                className="w-full bg-transparent text-gray-500 font-medium py-2 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all text-center text-xs"
                            >
                                Kategori Yönetimi
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 🏗️ SARF MALZEMELER (Consumables) */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full border-t-4 border-t-amber-500">
                        <div className="p-8 pb-4">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-amber-600">
                                    🏗️
                                </div>
                                {stats.consumables.lowStock > 0 && (
                                    <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold border border-rose-100 animate-pulse">
                                        ⚠️ {stats.consumables.lowStock} Azalan Stok
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Malzemeler</h2>
                            <p className="text-gray-500 text-sm mt-2 leading-relaxed h-10">
                                * Satışı yapılmayan, üretim ve hizmetler için kullanılan stoklar
                            </p>
                            <div className="mt-8 flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900">{stats.consumables.total}</span>
                                <span className="text-gray-400 font-medium text-sm uppercase tracking-widest">Kayıtlı Malzeme</span>
                            </div>
                        </div>

                        <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-2">
                            <Link
                                href="/admin/inventory/consumables"
                                className="w-full bg-white border border-gray-200 text-amber-600 font-bold py-3 rounded-xl hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all text-center text-sm shadow-sm"
                            >
                                Sarf Malzeme Yönetimi
                            </Link>
                            <Link
                                href="/admin/inventory/categories?type=consumable"
                                className="w-full bg-transparent text-gray-500 font-medium py-2 rounded-xl hover:text-amber-600 hover:bg-amber-50 transition-all text-center text-xs"
                            >
                                Kategori Yönetimi
                            </Link>
                        </div>
                    </div>
                </div>


                {/* 🛠️ HİZMETLER (Services) */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full border-t-4 border-t-emerald-500">
                        <div className="p-8 pb-4">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-emerald-600">
                                    🛠️
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Hizmetler</h2>
                            <p className="text-gray-500 text-sm mt-2 leading-relaxed h-10">
                                * Müşterilere sunulan hizmetler
                            </p>
                            <div className="mt-8 flex items-baseline gap-2">
                                <span className="text-5xl font-black text-gray-900">{stats.services.total}</span>
                                <span className="text-gray-400 font-medium text-sm uppercase tracking-widest">Kayıtlı Hizmet</span>
                            </div>
                        </div>

                        <div className="mt-auto p-4 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-2">
                            <Link
                                href="/admin/inventory/services"
                                className="w-full bg-white border border-gray-200 text-emerald-600 font-bold py-3 rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all text-center text-sm shadow-sm"
                            >
                                Hizmet Yönetimi
                            </Link>
                            <Link
                                href="/admin/inventory/categories?type=service"
                                className="w-full bg-transparent text-gray-500 font-medium py-2 rounded-xl hover:text-emerald-600 hover:bg-emerald-50 transition-all text-center text-xs"
                            >
                                Kategori Yönetimi
                            </Link>
                        </div>
                    </div>
                </div>



            </div>
        </div>
    );
}