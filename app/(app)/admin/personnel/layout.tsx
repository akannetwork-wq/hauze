import React from 'react';
import SubNav from '@/components/admin/sub-nav';
import ModuleGuard from '@/components/admin/rbac-guard';

export default function PersonnelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { href: '/admin/personnel', label: 'Özet', icon: '📊', exact: true },
        { href: '/admin/personnel/employees', label: 'Çalışanlar', icon: '👥' },
        { href: '/admin/personnel/attendance', label: 'Yoklama', icon: '📅' },
        { href: '/admin/personnel/tasks', label: 'Görevler', icon: '✅' },
        { href: '/admin/personnel/finance', label: 'Maaş & Ödeme', icon: '💸' },
        { href: '/admin/personnel/settings', label: 'Ayarlar', icon: '⚙️' },
    ];

    return (
        <ModuleGuard moduleKey="personnel">
            <div className="flex flex-1 overflow-hidden">
                <SubNav title="Personel" items={navItems} />
                <div className="flex-1 overflow-y-auto bg-white">
                    {children}
                </div>
            </div>
        </ModuleGuard>
    );
}
