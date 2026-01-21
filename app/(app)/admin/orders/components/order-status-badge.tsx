import React from 'react';

const statusConfig: Record<string, { label: string, color: string, icon: string }> = {
    pending: { label: 'Bekliyor', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: '⏳' },
    preparing: { label: 'Hazırlanıyor', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: '📦' },
    ready: { label: 'Hazır', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: '✅' },
    shipped: { label: 'Kargolandı', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: '🚚' },
    delivered: { label: 'Teslim Edildi', color: 'bg-green-50 text-green-700 border-green-100', icon: '🏠' },
    cancelled: { label: 'İptal Edildi', color: 'bg-red-50 text-red-700 border-red-100', icon: '✕' },
    completed: { label: 'Tamamlandı', color: 'bg-green-50 text-green-700 border-green-100', icon: '✨' },
    paid: { label: 'Ödendi', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: '💰' },
    partial: { label: 'Kısmi Ödeme', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: '🌗' },
};

export default function OrderStatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-50 text-gray-700 border-gray-100', icon: '?' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${config.color}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
}
