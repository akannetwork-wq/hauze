'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SubNavItem {
    href: string;
    label: string;
    icon?: string;
}

interface SubNavProps {
    title: string;
    items: SubNavItem[];
}

export default function SubNav({ title, items }: SubNavProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname === href || (pathname.startsWith(href) && href !== '/admin');
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 animate-in slide-in-from-left duration-300">
            <div className="p-8 pb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    {title}
                </h3>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${isActive(item.href)
                                ? 'bg-indigo-50 text-indigo-600 font-bold'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium'
                            }`}
                    >
                        {item.icon && <span>{item.icon}</span>}
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
