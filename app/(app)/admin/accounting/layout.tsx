import React from 'react';
import SubNav from '@/components/admin/sub-nav';
import ModuleGuard from '@/components/admin/rbac-guard';

export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { href: '/admin/accounting', label: 'Genel Bakış', icon: '📊', exact: true },
        { href: '/admin/accounting/customers', label: 'Müşteriler', icon: '👤' },
        { href: '/admin/accounting/suppliers', label: 'Tedarikçiler', icon: '🏢' },
        { href: '/admin/accounting/subcontractors', label: 'Taşeronlar', icon: '🏢' },
        { href: '/admin/accounting/ledger', label: 'Hesap Planı', icon: '📖' },
        { href: '/admin/accounting/safes', label: 'Kasalar', icon: '💸' },
        { href: '/admin/accounting/banks', label: 'Bankalar', icon: '🏦' },
        { href: '/admin/accounting/credit-cards', label: 'Kredi Kartları', icon: '💳' },
        { href: '/admin/accounting/pos', label: 'POS Hesapları', icon: '📠' },
        { href: '/admin/accounting/checks', label: 'Çekler', icon: '🎫' },
    ];

    return (
        <ModuleGuard moduleKey="accounting">
            <div className="flex flex-1 overflow-hidden">
                <SubNav title="Muhasebe" items={navItems} />
                <div className="flex-1 overflow-y-auto bg-white">
                    {children}
                </div>
            </div>
        </ModuleGuard>
    );
}
