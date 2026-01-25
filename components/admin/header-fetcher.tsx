import React from 'react';
import GlobalSearch from '@/components/admin/global-search';
import { getNotifications } from '@/app/actions/notifications';
import Link from 'next/link';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

export default async function AdminHeaderFetcher() {
    const notifications = await getNotifications();
    const notificationCount = notifications.length;

    return (
        <header className="h-16 border-b border-border px-8 flex items-center justify-between sticky top-0 z-40">
            <GlobalSearch />
            <div className="flex items-center gap-6">
                <Link href="?drawer=global-order" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <ShoppingBagIcon className="w-5 h-5" />
                    <span className="font-medium text-sm">Hızlı Satış</span>
                </Link>
                <Link href="/admin/notifications" className="relative w-9 h-9 bg-muted rounded-xl flex items-center justify-center text-lg hover:bg-primary/10 transition-all hover:scale-105 active:scale-95">
                    🔔
                    {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-background rounded-full"></span>
                    )}
                </Link>
                <div className="flex items-center gap-4 border-l border-border pl-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-foreground">Yönetici</div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Süper Admin</div>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm ring-2 ring-background"></div>
                </div>
            </div>
        </header>
    );
}
