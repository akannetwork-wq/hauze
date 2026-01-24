import React from 'react';
import ModuleGuard from '@/components/admin/rbac-guard';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGuard moduleKey="pages">
            {children}
        </ModuleGuard>
    );
}
