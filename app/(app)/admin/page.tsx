import React from 'react';
import { getCurrentContext } from '@/app/actions/tenant-context';

export default async function AdminDashboardPage() {
    const context = await getCurrentContext();
    if (!context) return <div>Tenant not found</div>;
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p>Merhaba {context?.tenant.name}</p>
            </div>
        </div>
    );
}
