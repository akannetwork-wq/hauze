import React from 'react';
import SubNav from '@/components/admin/sub-nav';

export default function InventoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { href: '/admin/inventory', label: 'Özet', icon: '📊' },
        { href: '/admin/inventory/products', label: 'Ürün Kartları', icon: '📦' },
        { href: '/admin/inventory/categories', label: 'Kategoriler', icon: '📁' },
        { href: '/admin/inventory/consumables', label: 'Sarf Malzeme', icon: '🧪' },
        { href: '/admin/inventory/services', label: 'Hizmetler', icon: '🛠️' },
    ];

    return (
        <div className="flex flex-1 overflow-hidden">
            <SubNav title="Envanter" items={navItems} />
            <div className="flex-1 overflow-y-auto bg-white">
                {children}
            </div>
        </div>
    );
}
