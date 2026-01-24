import React, { Suspense } from 'react';
import { getCurrentContext } from '@/app/actions/tenant-context';
import DashboardContent from './components/dashboard-content';
import ModuleGuard from '@/components/admin/rbac-guard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const context = await getCurrentContext();
    if (!context) return <div>Tenant not found</div>;

    return (
        <ModuleGuard moduleKey="dashboard">
            <div className="p-4 w-full flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Hoşgeldiniz, {context.tenant.name} işletme performansı genel bakışını buradan takip edebilirsiniz.
                    </p>
                </div>
                <hr className="border-gray-200" />
                <Suspense fallback={<div className="p-8 text-center text-gray-500">Yükleniyor...</div>}>
                    <DashboardContent />
                </Suspense>
            </div>
        </ModuleGuard>
    );
}
