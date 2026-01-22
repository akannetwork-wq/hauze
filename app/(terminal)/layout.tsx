
import React, { Suspense } from 'react';
import { logout } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function TerminalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Note: In Next.js 16 with cacheComponents, this layout shell will be 
    // static-ish and the following will trigger a streaming response.
    const supabase = await createClient();

    // 1. Get User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
        redirect('/login');
    }

    // 2. Check System Tenant Membership (NETSPACE)
    const { data: systemTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('name', 'NETSPACE')
        .single();

    if (!systemTenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">
                System Error: NETSPACE tenant not found.
            </div>
        );
    }

    const { data: membership } = await supabase
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', systemTenant.id)
        .eq('user_id', user.id)
        .single();

    if (!membership) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-4">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-gray-400 mb-8 max-w-md text-center">
                    You do not have permission to access the Terminal. This area is restricted to System Administrators.
                </p>

                <form action={logout}>
                    <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors">
                        Sign Out
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex">
            <aside className="w-64 border-r border-gray-800 p-4">
                <h1 className="text-xl font-bold mb-8 tracking-wider text-green-400">TERMINAL</h1>
                <nav className="space-y-2">
                    <a href="/terminal" className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-300">Overview</a>
                    <a href="/terminal/tenants" className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-300">Tenants</a>
                    <a href="/terminal/modules" className="block px-3 py-2 rounded hover:bg-gray-800 text-gray-300">Modules</a>
                </nav>
                <div className="mt-8 pt-8 border-t border-gray-800">
                    <form action={logout}>
                        <button className="text-sm text-red-400 hover:text-red-300">Exit Terminal</button>
                    </form>
                </div>
            </aside>
            <main className="flex-1 p-6 overflow-auto">
                <Suspense fallback={<div className="animate-pulse text-gray-500">Loading Terminal Content...</div>}>
                    {children}
                </Suspense>
            </main>
        </div>
    );
}
