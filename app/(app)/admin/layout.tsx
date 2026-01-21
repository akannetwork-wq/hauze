import React from 'react';
import { logout } from '@/app/actions/auth';
import { getCurrentContext } from '@/app/actions/tenant-context';
import { Metadata } from 'next';
import { RefreshHandler } from '@/components/admin/refresh-handler';

// CRITICAL: Force dynamic rendering.

// Next.js caches routes by URL Path by default. Since '/admin' is the same path
// for ALL tenants (agora.localhost/admin, localhost/admin), we must disable caching
// to ensure the Host header is respected and we don't serve one tenant's layout to another.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    const context = await getCurrentContext();
    if (!context) return { title: 'Netspace Admin' };
    return {
        title: `${context.tenant.name} - Admin Panel`
    };
}


import GlobalSearch from '@/components/admin/global-search';
import { getNotifications } from '@/app/actions/notifications';
import Sidebar from '@/components/admin/sidebar';
import Link from 'next/link';

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const context = await getCurrentContext();
    const notifications = await getNotifications();
    const notificationCount = notifications.length;

    // If no tenant found (e.g. visiting internal app domain directly without subdomain), 
    // show error or redirect. For now, simple null check.
    if (!context) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Tenant not found for this hostname.
            </div>
        )
    }

    const { tenant, modules } = context;

    return (
        <div className="min-h-screen flex bg-gray-50" key={tenant.id}>

            <RefreshHandler />

            {/* Sidebar */}
            <div className="flex flex-col">
                <Sidebar
                    tenantName={tenant.name}
                    notificationCount={notificationCount}
                    modules={modules}
                />
                <div className="bg-white border-r border-gray-200 p-6 pt-0">
                    <form action={logout}>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                            <span>🚪</span> Çıkış Yap
                        </button>
                    </form>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-40">
                    <GlobalSearch />
                    <div className="flex items-center gap-6">
                        <Link href="/admin/notifications" className="relative w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-xl hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95">
                            🔔
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                        </Link>
                        <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold text-gray-900">Yönetici</div>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Süper Admin</div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg ring-4 ring-white"></div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
