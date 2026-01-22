import React, { Suspense } from 'react';
import { getPageBySlug } from '@/app/actions/cms-public';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CartProvider } from '@/components/commerce/cart-provider';
import SectionRenderer from '@/components/site/sections';

interface PageProps {
    params: Promise<{
        locale: string;
        slug?: string[];
    }>;
}

export default function UniversalPage({ params }: PageProps) {
    return (
        <Suspense fallback={<div className="p-20 text-center animate-pulse text-gray-400">Loading Page...</div>}>
            <UniversalPageContent params={params} />
        </Suspense>
    );
}

async function UniversalPageContent({ params }: PageProps) {
    const { slug } = await params;

    let hostname = 'localhost';
    try {
        const headersList = await headers();
        const host = headersList.get('host')!;
        hostname = host.split(':')[0];
    } catch (e) {
        // Fallback for prerender pass
    }

    const slugPath = slug ? slug.join('/') : 'home';
    const result = await getPageBySlug(hostname, slugPath);

    if (!result) {
        if (slugPath === 'home') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-tighter">
                    <div className="text-center">
                        <h1 className="text-4xl font-black mb-4">Welcome to {hostname}</h1>
                        <p className="text-gray-400">This site has not been set up yet. (No Homepage found)</p>
                    </div>
                </div>
            )
        }
        return notFound();
    }

    const { page, tenant } = result;

    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col">
                {/* Header / Nav (Simplified) */}
                <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
                    <div className="font-black text-xl tracking-tighter uppercase">{tenant.name}</div>
                    <nav className="space-x-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <a href="/home" className="hover:text-indigo-600 transition-colors">Home</a>
                    </nav>
                </header>

                <main className="flex-1">
                    {/* Render Modular Sections */}
                    {page.sections?.map((section: any) => (
                        <SectionRenderer key={section.id} section={section} />
                    ))}

                    {/* Fallback for empty pages */}
                    {(!page.sections || page.sections.length === 0) && (
                        <div className="max-w-4xl mx-auto py-24 px-6 text-center">
                            <h1 className="text-5xl font-black mb-6 tracking-tighter uppercase">{page.title}</h1>
                            <p className="text-gray-400 text-lg">This page is currently being built by our team.</p>
                        </div>
                    )}
                </main>
            </div>
        </CartProvider>
    );
}
