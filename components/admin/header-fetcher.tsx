import React from 'react';
import GlobalSearch from '@/components/admin/global-search';
import { getNotifications } from '@/app/actions/notifications';
import Link from 'next/link';

export default async function AdminHeaderFetcher() {
    const notifications = await getNotifications();
    const notificationCount = notifications.length;

    return (
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
    );
}
