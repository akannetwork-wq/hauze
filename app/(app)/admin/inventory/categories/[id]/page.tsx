import { getCategory, getCategories } from '@/app/actions/inventory';
import CategoryEditorClient from '@/app/(app)/admin/inventory/categories/[id]/editor-client';
import { redirect } from 'next/navigation';
import { ProductCategory } from '@/types';

export default async function CategoryEditorPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params;
    const sParams = await searchParams;
    const isNew = id === 'new';
    const type = (sParams.type as any) || 'product';

    let category: ProductCategory | null = null;

    // Only get categories of the same type for parent selection
    const allCategories = await getCategories(type);

    if (!isNew) {
        category = await getCategory(id);
        if (!category) redirect(`/admin/inventory/categories?type=${type}`);
    } else {
        // Pre-fill type for new category
        category = { type } as any;
    }

    return (
        <CategoryEditorClient
            initialData={category}
            allCategories={allCategories}
            type={type}
        />
    );
}
