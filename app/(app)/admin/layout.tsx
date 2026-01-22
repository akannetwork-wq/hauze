import React, { Suspense } from 'react';
import { logout } from '@/app/actions/auth';
import { getCurrentContext } from '@/app/actions/tenant-context';
import { Metadata } from 'next';
import { RefreshHandler } from '@/components/admin/refresh-handler';
import { SidebarSkeleton, HeaderSkeleton, PageSkeleton } from '@/components/admin/skeletons';
import AdminSidebarFetcher from '@/components/admin/sidebar-fetcher';
import AdminHeaderFetcher from '@/components/admin/header-fetcher';

// PPR incremental allows us to mark this layout for partial prerendering
// Next.js 16 cacheComponents handles the streaming behavior

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
    const context = await getCurrentContext();
    if (!context) return { title: 'Netspace Admin' };
    return {
        title: `${context.tenant.name} - Admin Panel`
    };
}

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <div className="flex flex-col">
                <Suspense fallback={<SidebarSkeleton />}>
                    <RefreshHandler />
                    <AdminSidebarFetcher />
                </Suspense>

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
                <Suspense fallback={<HeaderSkeleton />}>
                    <AdminHeaderFetcher />
                </Suspense>

                <main className="flex-1 p-8">
                    <Suspense fallback={<PageSkeleton />}>
                        {children}
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
