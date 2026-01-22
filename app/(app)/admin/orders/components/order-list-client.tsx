'use client';

import React, { useState, useMemo } from 'react';
import OrderStatusBadge from './order-status-badge';
import OrderDialog from './order-dialog';
import { useRouter } from 'next/navigation';

interface Props {
    initialOrders: any[];
}

type TabType = 'all' | 'pending' | 'preparing' | 'in_progress' | 'completed' | 'cancelled' | 'unpaid';

export default function OrderListClient({ initialOrders }: Props) {
    const router = useRouter();
    const [orders, setOrders] = useState(initialOrders);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const filteredAndSortedOrders = useMemo(() => {
        let result = [...orders];

        // 1. Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(o => {
                const orderIdMatch = o.id.toLowerCase().includes(query);
                const orderNumMatch = o.order_number?.toLowerCase().includes(query);
                const contactName = (o.contacts?.company_name || `${o.contacts?.first_name} ${o.contacts?.last_name}`).toLowerCase();
                return orderIdMatch || orderNumMatch || contactName.includes(query);
            });
        }

        // 2. Tab Filter
        if (activeTab !== 'all') {
            if (activeTab === 'unpaid') {
                result = result.filter(o => o.payment_status !== 'paid');
            } else if (activeTab === 'pending') {
                result = result.filter(o => o.status === 'pending');
            } else if (activeTab === 'preparing') {
                result = result.filter(o => o.status === 'preparing');
            } else if (activeTab === 'in_progress') {
                result = result.filter(o => ['ready', 'shipped'].includes(o.status));
            } else if (activeTab === 'completed') {
                result = result.filter(o => ['delivered', 'completed'].includes(o.status));
            } else if (activeTab === 'cancelled') {
                result = result.filter(o => o.status === 'cancelled');
            }
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
            if (sortBy === 'amount') {
                return sortOrder === 'desc' ? b.total - a.total : a.total - b.total;
            }
            if (sortBy === 'name') {
                const nameA = (a.contacts?.company_name || `${a.contacts?.first_name} ${a.contacts?.last_name}`).toLowerCase();
                const nameB = (b.contacts?.company_name || `${b.contacts?.first_name} ${b.contacts?.last_name}`).toLowerCase();
                return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
            }
            return 0;
        });

        return result;
    }, [orders, searchQuery, activeTab, sortBy, sortOrder]);

    const tabs: { id: TabType, label: string, icon: string }[] = [
        { id: 'all', label: 'Tümü', icon: '📋' },
        { id: 'pending', label: 'Bekliyor', icon: '⏳' },
        { id: 'preparing', label: 'Hazırlanıyor', icon: '📦' },
        { id: 'in_progress', label: 'İşlemde', icon: '🚚' },
        { id: 'completed', label: 'Tamamlanan', icon: '✨' },
        { id: 'unpaid', label: 'Ödenmemiş', icon: '💰' },
        { id: 'cancelled', label: 'İptal Edilenler', icon: '' },
    ];

    return (
        <div className="space-y-6">
            {/* Filters & Search */}

            <div className="w-full md:w-96 relative">
                <input
                    type="text"
                    placeholder="Sipariş no veya isim ile ara..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-sm text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                <div className="flex items-center gap-2 bg-white p-1 rounded-sm border border-gray-100 shadow-sm overflow-x-auto w-full md:w-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xs text-xs font-black transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sorting */}
                <div className="flex justify-end gap-2">
                    <select
                        className="text-xs font-bold bg-white border border-gray-100 rounded-sm px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="date">Tarihe Göre</option>
                        <option value="amount">Tutara Göre</option>
                        <option value="name">İsme Göre</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 bg-white border border-gray-100 rounded-sm hover:bg-gray-50 transition-all shadow-sm"
                        title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                    >
                        {sortOrder === 'asc' ? '🔼' : '🔽'}
                    </button>
                </div>


            </div>


            {/* Orders Table */}
            <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/50">
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sipariş No</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Müşteri</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Toplam</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ödeme</th>
                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredAndSortedOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="group hover:bg-indigo-50/30 transition-all cursor-pointer"
                                    onClick={() => setSelectedOrderId(order.id)}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm font-black text-gray-900 font-mono">#{order.id.slice(0, 8).toUpperCase()}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-bold text-gray-900">
                                            {order.contacts?.company_name || `${order.contacts?.first_name} ${order.contacts?.last_name}`}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                        {new Date(order.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-sm font-black text-gray-900">
                                            {order.total.toLocaleString('tr-TR', { style: 'currency', currency: order.currency || 'TRY' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-[10px] font-black uppercase ${order.payment_status === 'paid' ? 'text-green-600' : order.payment_status === 'partial' ? 'text-amber-600' : 'text-red-600'}`}>
                                            {order.payment_status === 'paid' ? 'Ödendi' : order.payment_status === 'partial' ? 'Kısmi' : 'Bekliyor'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <OrderStatusBadge status={order.status} />
                                    </td>
                                </tr>
                            ))}
                            {filteredAndSortedOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="text-4xl mb-4">📭</div>
                                        <div className="text-gray-400 font-medium italic text-sm">Filtrelere uygun sipariş bulunamadı.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrderId && (
                <OrderDialog
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    onSuccess={() => {
                        router.refresh();
                        // Optional: trigger local update or wait for server revalidation
                    }}
                />
            )}
        </div>
    );
}
