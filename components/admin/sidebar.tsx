'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';

interface Props {
    tenantName: string;
    notificationCount: number;
    modules: any[];
}

export default function Sidebar({ tenantName, notificationCount, modules }: Props) {
    const pathname = usePathname();

    const menuItems = [
        { href: '/admin', label: 'Panel', icon: '🏠' },
        { href: '/admin/pages', label: 'Sayfalar', icon: '📄' },
        { href: '/admin/inventory', label: 'Envanter', icon: '📦' },
        { href: '/admin/wms', label: 'WMS', icon: '🏢' },
        { href: '/admin/accounting', label: 'Muhasebe', icon: '💰' },
        { href: '/admin/orders', label: 'Siparişler', icon: '🛍️' },
        { href: '/admin/personnel', label: 'Personel', icon: '👥' },
    ];

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <div className="w-20 shrink-0 relative z-50">
            <aside className="fixed inset-y-0 left-0 w-20 hover:w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out group shadow-sm overflow-hidden whitespace-nowrap">
                {/* Header / Logo */}
                <div className="p-5 mb-4 overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 min-w-[2.5rem] bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 shrink-0">
                            {tenantName.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-black text-xl text-gray-900 tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {tenantName}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar overflow-x-hidden">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all ${isActive(item.href)
                                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                                : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-medium'
                                }`}
                        >
                            <span className="text-xl shrink-0">{item.icon}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                                {item.label}
                            </span>
                        </Link>
                    ))}

                    <Link
                        href="/admin/notifications"
                        className={`flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all group/item ${isActive('/admin/notifications')
                            ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                            : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-medium'
                            }`}
                    >
                        <div className="relative shrink-0">
                            <span className="text-xl">🔔</span>
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white">
                                    {notificationCount}
                                </span>
                            )}
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                            Bildirimler
                        </span>
                    </Link>

                    {/* Modules Header */}
                    {modules.length > 0 && (
                        <div className="pt-6 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Modüller
                        </div>
                    )}

                    {modules.map((m: any) => (
                        <Link
                            key={m.key}
                            href={`/admin/${m.key}`}
                            className={`flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all capitalize shrink-0 ${isActive(`/admin/${m.key}`)
                                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                                : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-medium'
                                }`}
                        >
                            <span className="text-xl shrink-0">🧩</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                                {m.name}
                            </span>
                        </Link>
                    ))}

                    {/* System Header */}
                    <div className="pt-6 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Sistem
                    </div>
                    <Link
                        href="/admin/settings"
                        className={`flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all ${isActive('/admin/settings')
                            ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                            : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-medium'
                            }`}
                    >
                        <span className="text-xl shrink-0">⚙️</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                            Ayarlar
                        </span>
                    </Link>
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-gray-100 mt-auto overflow-hidden">
                    <form action={logout}>
                        <button className="w-full flex items-center gap-4 px-3.5 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold">
                            <span className="text-xl shrink-0">🚪</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                                Çıkış Yap
                            </span>
                        </button>
                    </form>
                </div>
            </aside>
        </div>
    );
}
