import { getPage, getPages, updatePage } from '@/app/actions/cms';
import { getProducts, getCategories } from '@/app/actions/inventory';
import { notFound } from 'next/navigation';
import PageEditorClient from './editor-client';

export default async function PageEditor({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Parallel fetch for speed
    const [page, allPages, products, categories] = await Promise.all([
        getPage(id),
        getPages(),
        getProducts(),
        getCategories()
    ]);

    if (!page) notFound();

    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <PageEditorClient
                initialPage={page}
                allPages={allPages}
                products={products}
                categories={categories}
            />
        </div>
    );
}
