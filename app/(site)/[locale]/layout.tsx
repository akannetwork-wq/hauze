import React, { Suspense } from 'react';
import SiteHeaderFetcher from '@/components/site/header-fetcher';

export default async function SiteLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    return (
        <div className="min-h-screen flex flex-col">
            <Suspense fallback={<header className="bg-white border-b py-4 px-6 h-16 animate-pulse" />}>
                <SiteHeaderFetcher locale={locale} />
            </Suspense>

            <main className="flex-1">
                <Suspense fallback={<div className="p-8 text-center text-gray-400 animate-pulse">Loading Content...</div>}>
                    {children}
                </Suspense>
            </main>

            <footer className="py-6 bg-gray-100 text-center text-sm text-gray-500">
                Powered by Netspace
            </footer>
        </div>
    );
}
