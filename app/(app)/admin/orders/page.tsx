'use server';

import React from 'react';
import { getOrders } from '@/app/actions/orders';
import OrderListClient from './components/order-list-client';

export default async function OrdersPage() {
    const orders = await getOrders();

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'preparing').length,
        completed: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Siparişler</h1>
                    <p className="text-gray-500 mt-1">İşletmenizin tüm satış ve sipariş süreçlerini yönetin.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-lg hover:border-indigo-100">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl">🛍️</div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam Sipariş</div>
                        <div className="text-2xl font-black text-gray-900">{stats.total}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-lg hover:border-amber-100">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">⏳</div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bekleyen/Hazırlanan</div>
                        <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-lg hover:border-green-100">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-xl">✨</div>
                    <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tamamlanan</div>
                        <div className="text-2xl font-black text-green-600">{stats.completed}</div>
                    </div>
                </div>
            </div>

            {/* Client-side Orders Management */}
            <OrderListClient initialOrders={orders} />
        </div>
    );
}
