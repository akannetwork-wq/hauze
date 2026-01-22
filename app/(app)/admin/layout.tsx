import React, { Suspense } from 'react';
import { logout } from '@/app/actions/auth';
import { getCurrentContext } from '@/app/actions/tenant-context';
import { Metadata } from 'next';
import { RefreshHandler } from '@/components/admin/refresh-handler';
import { SidebarSkeleton, HeaderSkeleton, PageSkeleton } from '@/components/admin/skeletons';
import AdminSidebarFetcher from '@/components/admin/sidebar-fetcher';
import AdminHeaderFetcher from '@/components/admin/header-fetcher';
import DrawerManager from '@/components/admin/drawer-manager';

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
        <div className="min-h-screen flex bg-gray-50 w-full">
            {/* Global Drawer Manager (URL Based) */}
            <DrawerManager />

            {/* Main Navigation (Compact Sidebar) */}
            <Suspense fallback={<SidebarSkeleton />}>
                <RefreshHandler />
                <AdminSidebarFetcher />
            </Suspense>

            {/* Main Area (SubNav + Content) */}
            <div className="flex-1 flex flex-col w-full min-w-0">
                <Suspense fallback={<HeaderSkeleton />}>
                    <AdminHeaderFetcher />
                </Suspense>

                <main className="flex-1 flex overflow-hidden w-full">
                    <Suspense fallback={<PageSkeleton />}>
                        {children}
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
