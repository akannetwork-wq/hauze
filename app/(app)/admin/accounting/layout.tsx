import React from 'react';
import SubNav from '@/components/admin/sub-nav';

export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { href: '/admin/accounting', label: 'Genel Bakış', icon: '📊' },
        { href: '/admin/accounting/customers', label: 'Müşteriler', icon: '👤' },
        { href: '/admin/accounting/suppliers', label: 'Tedarikçiler', icon: '🏢' },
        { href: '/admin/accounting/ledger', label: 'Hesap Planı', icon: '📖' },
    ];

    return (
        <div className="flex flex-1 overflow-hidden">
            <SubNav title="Muhasebe" items={navItems} />
            <div className="flex-1 overflow-y-auto bg-white">
                {children}
            </div>
        </div>
    );
}
