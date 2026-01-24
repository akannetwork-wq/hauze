import React from 'react';
import ModuleGuard from '@/components/admin/rbac-guard';

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGuard moduleKey="orders">
            {children}
        </ModuleGuard>
    );
}
