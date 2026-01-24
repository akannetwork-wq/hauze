import React from 'react';
import ModuleGuard from '@/components/admin/rbac-guard';

export default function WmsLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModuleGuard moduleKey="wms">
            {children}
        </ModuleGuard>
    );
}
