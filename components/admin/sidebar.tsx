'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { useTheme } from '@/components/theme-provider';
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
    PuzzlePieceIcon,
    SunIcon,
    MoonIcon
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
    const { theme, setTheme } = useTheme();

    const menuItems = [
        { href: '/admin', label: 'Panel', icon: <HomeIcon className="w-5 h-5" />, key: 'dashboard' },
        { href: '/admin/accounting', label: 'Muhasebe', icon: <BanknotesIcon className="w-5 h-5" />, key: 'accounting' },
        { href: '/admin/orders', label: 'Siparişler', icon: <ShoppingBagIcon className="w-5 h-5" />, key: 'orders' },
        { href: '/admin/personnel', label: 'Personel', icon: <UsersIcon className="w-5 h-5" />, key: 'personnel' },
        { href: '/admin/inventory', label: 'Envanter', icon: <CubeIcon className="w-5 h-5" />, key: 'inventory' },
        { href: '/admin/wms', label: 'WMS', icon: <BuildingOffice2Icon className="w-5 h-5" />, key: 'wms' },
        { href: '/admin/pages', label: 'Sayfalar', icon: <DocumentTextIcon className="w-5 h-5" />, key: 'pages' },
    ];

    const canSee = (key: string) => {
        if (userRole === 'super_admin') return true;
        if (key === 'dashboard') return true;
        return userPermissions[key] === true;
    };

    const filteredMenuItems = menuItems.filter(item => canSee(item.key));

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const toggleTheme = (e: React.MouseEvent) => {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="w-16 shrink-0 relative z-50">
            <aside className="fixed inset-y-0 left-0 w-16 hover:w-64 bg-[var(--sidebar-bg)] flex flex-col transition-all duration-300 ease-in-out group shadow-xl overflow-hidden whitespace-nowrap text-[var(--sidebar-foreground)]">

                {/* Header / Logo */}
                <div className="h-16 flex items-center px-4 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 min-w-[2rem] bg-primary rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                            {tenantName.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-sm tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate">
                            {tenantName}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-2 space-y-1 overflow-y-auto no-scrollbar overflow-x-hidden py-4">
                    {filteredMenuItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 p-2 rounded-md transition-all group/link relative
                                    ${active
                                        ? 'bg-[var(--sidebar-accent)] text-white'
                                        : 'text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-muted)] hover:text-white'
                                    }`}
                            >
                                <span className={`shrink-0 ${active ? 'text-white' : 'text-[var(--sidebar-foreground)]/70 group-hover/link:text-white'}`}>
                                    {item.icon}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    {/* Modules Header 
                    {modules.length > 0 && (
                        <div className="pt-6 pb-2 text-[10px] font-bold text-[var(--sidebar-foreground)]/40 uppercase tracking-widest pl-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Modüller
                        </div>
                    )}
                        

                    {modules.map((m: any) => {
                        const active = isActive(`/admin/${m.key}`);
                        return (
                            <Link
                                key={m.key}
                                href={`/admin/${m.key}`}
                                className={`flex items-center gap-3 p-2 rounded-md transition-all capitalize group/link
                                    ${active
                                        ? 'bg-[var(--sidebar-accent)] text-white'
                                        : 'text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-muted)] hover:text-white'
                                    }`}
                            >
                                <span className="shrink-0">
                                    <PuzzlePieceIcon className="w-5 h-5" />
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                                    {m.name}
                                </span>
                            </Link>
                        );
                    })}

                    */}

                    {/* System Section
                    <div className="mt-auto border-t border-[var(--sidebar-muted)] my-2"></div>

                    <Link
                        href="/admin/settings"
                        className={`flex items-center gap-3 p-2 rounded-md transition-all group/link
                            ${isActive('/admin/settings')
                                ? 'bg-[var(--sidebar-accent)] text-white'
                                : 'text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-muted)] hover:text-white'
                            }`}
                    >
                        <span className="shrink-0">
                            <Cog6ToothIcon className="w-5 h-5" />
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                            Ayarlar
                        </span>
                    </Link>

                     */}

                    {/* Theme Toggle Button 
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 p-2 rounded-md transition-all text-[var(--sidebar-foreground)]/70 hover:bg-[var(--sidebar-muted)] hover:text-white group/link"
                    >
                        <span className="shrink-0">
                            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium text-left">
                            {theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
                        </span>
                    </button>
                    */}

                </nav>

                {/* Footer Actions */}
                <div className="p-3 bg-[var(--sidebar-bg)]">
                    <form action={logout}>
                        <button className="w-full flex items-center gap-3 p-2 text-red-400 hover:bg-white/5 hover:text-red-300 rounded-md transition-all font-medium">
                            <span className="shrink-0">
                                <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
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
