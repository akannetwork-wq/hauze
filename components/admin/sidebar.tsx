'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import {
    HomeIcon,
    DocumentTextIcon,
    CubeIcon,
    BuildingOffice2Icon,
    BanknotesIcon,
    ShoppingBagIcon,
    UsersIcon,
    BellIcon,
    Cog6ToothIcon,
    ArrowRightStartOnRectangleIcon,
    PuzzlePieceIcon
} from '@heroicons/react/24/outline';

interface Props {
    tenantName: string;
    notificationCount: number;
    modules: any[];
    userRole: string;
    userPermissions: any;
}

export default function Sidebar({ tenantName, notificationCount, modules, userRole, userPermissions }: Props) {
    const pathname = usePathname();

    const menuItems = [
        { href: '/admin', label: 'Panel', icon: <HomeIcon className="w-6 h-6" />, key: 'dashboard' },
        { href: '/admin/accounting', label: 'Muhasebe', icon: <BanknotesIcon className="w-6 h-6" />, key: 'accounting' },
        { href: '/admin/orders', label: 'Siparişler', icon: <ShoppingBagIcon className="w-6 h-6" />, key: 'orders' },
        { href: '/admin/personnel', label: 'Personel', icon: <UsersIcon className="w-6 h-6" />, key: 'personnel' },
        { href: '/admin/inventory', label: 'Envanter', icon: <CubeIcon className="w-6 h-6" />, key: 'inventory' },
        { href: '/admin/wms', label: 'WMS', icon: <BuildingOffice2Icon className="w-6 h-6" />, key: 'wms' },
        { href: '/admin/pages', label: 'Sayfalar', icon: <DocumentTextIcon className="w-6 h-6" />, key: 'pages' },
    ];

    const canSee = (key: string) => {
        if (userRole === 'super_admin') return true;
        // Panel is always visible? Or check 'dashboard'
        if (key === 'dashboard') return true;
        return userPermissions[key] === true;
    };

    const filteredMenuItems = menuItems.filter(item => canSee(item.key));

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <div className="w-16 shrink-0 relative z-50">
            <aside className="fixed inset-y-0 left-0 w-16 hover:w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ease-in-out group shadow-sm overflow-hidden whitespace-nowrap">

                {/* Header / Logo */}
                <div className="p-2 mb-4 overflow-hidden">
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
                <nav className="flex-1 px-2 space-y-1 overflow-y-auto no-scrollbar overflow-x-hidden">
                    {filteredMenuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 p-2 px-3 rounded-sm transition-all ${isActive(item.href)
                                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                                : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-medium'
                                }`}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                                {item.label}
                            </span>
                        </Link>
                    ))}

                    {/* Notifications
                    <Link
                        href="/admin/notifications"
                        className={`flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all group/item ${isActive('/admin/notifications')
                            ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                            : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-medium'
                            }`}
                    >
                        <div className="relative shrink-0">
                            <BellIcon className="w-6 h-6" />
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
                     */}

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
                            <span className="shrink-0">
                                <PuzzlePieceIcon className="w-6 h-6" />
                            </span>
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
                        <span className="shrink-0">
                            <Cog6ToothIcon className="w-6 h-6" />
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                            Ayarlar
                        </span>
                    </Link>

                    {userRole === 'super_admin' && (
                        <Link
                            href="/admin/users"
                            className={`flex items-center gap-4 px-3.5 py-3 rounded-2xl transition-all ${isActive('/admin/users')
                                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                                : 'hover:bg-gray-50 text-gray-500 hover:text-gray-900 font-medium'
                                }`}
                        >
                            <span className="shrink-0">
                                <UsersIcon className="w-6 h-6" />
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                                Kullanıcılar
                            </span>
                        </Link>
                    )}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-gray-100 mt-auto overflow-hidden">
                    <form action={logout}>
                        <button className="w-full flex items-center gap-4 px-3.5 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold">
                            <span className="shrink-0">
                                <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
                            </span>
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
