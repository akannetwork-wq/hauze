'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        { href: '/admin/wms', label: 'Depo (WMS)', icon: '🏢' },
        { href: '/admin/accounting', label: 'Muhasebe', icon: '💰' },
        { href: '/admin/accounting/customers', label: 'Müşteriler', icon: '📊' },
        { href: '/admin/accounting/suppliers', label: 'Tedarikçiler', icon: '📊' },
        { href: '/admin/orders', label: 'Siparişler', icon: '🛍️' },
        { href: '/admin/personnel', label: 'Personel', icon: '👥' },
    ];

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-screen sticky top-0">
            <div className="mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">
                        N
                    </div>
                    <div className="font-black text-xl text-gray-900 tracking-tight truncate">{tenantName}</div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive(item.href)
                                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                                : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900 font-medium'
                            }`}
                    >
                        <span>{item.icon}</span> {item.label}
                    </Link>
                ))}

                <Link
                    href="/admin/notifications"
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all group ${isActive('/admin/notifications')
                            ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                            : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900 font-medium'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <span>🔔</span> Bildirimler
                    </div>
                    {notificationCount > 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-lg transition-transform group-hover:scale-110 ${isActive('/admin/notifications') ? 'bg-white text-indigo-600 shadow-indigo-900/20' : 'bg-red-500 text-white shadow-red-200'
                            }`}>
                            {notificationCount}
                        </span>
                    )}
                </Link>

                {/* Dynamic Modules */}
                {modules.length > 0 && (
                    <div className="pt-6 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">Modüller</div>
                )}
                {modules.map((m: any) => (
                    <Link
                        key={m.key}
                        href={`/admin/${m.key}`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all capitalize ${isActive(`/admin/${m.key}`)
                                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                                : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900 font-medium'
                            }`}
                    >
                        <span>🧩</span> {m.name}
                    </Link>
                ))}

                <div className="pt-6 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4">Sistem</div>
                <Link
                    href="/admin/settings"
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive('/admin/settings')
                            ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100'
                            : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900 font-medium'
                        }`}
                >
                    <span>⚙️</span> Ayarlar
                </Link>
            </nav>
        </aside>
    );
}
