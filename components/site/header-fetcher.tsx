import React from 'react';
import { getPublicPages } from '@/app/actions/cms-public';
import { headers } from 'next/headers';

export default async function SiteHeaderFetcher({ locale }: { locale: string }) {
    // Check Hostname
    let hostname = 'localhost';
    try {
        const headersList = await headers();
        hostname = headersList.get('host')!.split(':')[0];
    } catch (e) {
        // Fallback for prerender pass
    }

    const menuItems = await getPublicPages(hostname, 'main');

    return (
        <header className="bg-white border-b py-4 px-6 flex justify-between items-center">
            <div className="font-bold text-xl">Tenant Site ({locale})</div>
            <nav className="flex gap-4">
                <a href={`/${locale}/home`} className="hover:underline text-sm font-medium">Home</a>
                {menuItems.map((page: any) => {
                    const title = (locale !== 'tr' && page.locales?.[locale]?.title)
                        ? page.locales[locale].title
                        : page.title;

                    const pathString = (locale !== 'tr' && page.locales?.[locale]?.path)
                        ? page.locales[locale].path
                        : page.path;

                    const cleanPath = pathString.startsWith('/') ? pathString : `/${pathString}`;

                    return (
                        <a
                            key={page.path}
                            href={`/${locale}${cleanPath}`}
                            className="hover:underline text-sm font-medium"
                        >
                            {title}
                        </a>
                    );
                })}
            </nav>
        </header>
    );
}
