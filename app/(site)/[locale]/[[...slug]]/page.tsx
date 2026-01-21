
import React from 'react';
import { getPageBySlug } from '@/app/actions/cms-public';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { CartProvider } from '@/components/commerce/cart-provider';
import { ProductGrid } from '@/components/commerce/product-grid';

interface PageProps {
    params: Promise<{
        locale: string;
        slug?: string[];
    }>;
}

export default async function UniversalPage({ params }: PageProps) {
    const { slug } = await params;
    const headersList = await headers();
    const host = headersList.get('host')!;
    const hostname = host.split(':')[0];

    const slugPath = slug ? slug.join('/') : 'home';

    const result = await getPageBySlug(hostname, slugPath);

    if (!result) {
        if (slugPath === 'home') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Welcome to {hostname}</h1>
                        <p>This site has not been set up yet. (No Homepage found)</p>
                    </div>
                </div>
            )
        }
        return notFound();
    }

    const { page, tenant } = result;

    return (
        <CartProvider>
            <div>
                {/* Header / Nav (Simplified) */}
                <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10 opacity-95">
                    <div className="font-bold text-xl">{tenant.name}</div>
                    <nav className="space-x-4 text-sm font-medium">
                        <a href="/home" className="hover:text-indigo-600">Home</a>
                        {/* Dynamic Links would go here */}
                    </nav>
                </header>

                {/* Render Sections */}
                {page.sections?.map((section: any) => (
                    <SectionRenderer key={section.id} section={section} tenantId={tenant.id} />
                ))}

                {(!page.sections || page.sections.length === 0) && (
                    <div className="max-w-4xl mx-auto py-12 px-6">
                        <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
                        <p>This page has no content blocks.</p>
                    </div>
                )}
            </div>
        </CartProvider>
    );
}

function SectionRenderer({ section, tenantId }: { section: any, tenantId: string }) {
    const { type, content } = section;

    switch (type) {
        case 'product-grid':
            return (
                <section className="max-w-7xl mx-auto py-12 px-6">
                    <h2 className="text-3xl font-bold mb-8 text-center">{content.headline || 'Our Products'}</h2>
                    <ProductGrid tenantId={tenantId} />
                </section>
            );
        case 'hero':
            return (
                <section className="bg-gray-900 text-white py-20 px-6 text-center">
                    <h1 className="text-5xl font-bold mb-4">{content.headline}</h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">{content.subheadline}</p>
                </section>
            );
        case 'text':
            return (
                <section className="max-w-3xl mx-auto py-12 px-6">
                    <div className="prose lg:prose-xl">
                        {content.text}
                    </div>
                </section>
            );
        case 'features':
            return (
                <section className="py-12 bg-gray-50 px-6">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-6 rounded shadow-sm">
                                <h3 className="font-bold mb-2">Feature {i}</h3>
                                <p className="text-gray-500">Placeholder feature text.</p>
                            </div>
                        ))}
                    </div>
                </section>
            );
        default:
            return <div className="py-4 text-center text-gray-400">Unknown Section Type: {type}</div>
    }
}
