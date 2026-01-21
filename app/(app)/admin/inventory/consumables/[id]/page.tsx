import { getProduct, getCategories } from '@/app/actions/inventory';
import ConsumableEditorClient from '@/app/(app)/admin/inventory/consumables/[id]/editor-client';
import { getPrices, getInventory } from '@/app/actions/commerce';
import { notFound } from 'next/navigation';
import { Product } from '@/types';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ConsumableEditorPage({ params }: Props) {
    const { id } = await params;
    const isNew = id === 'new';

    const categories = await getCategories('consumable');

    let initialData: Product | null = null;
    let initialPrices: any[] = [];
    let initialStock: any[] = [];

    if (!isNew) {
        initialData = await getProduct(id);
        if (!initialData) notFound();

        // Fetch specific data for this consumable
        const allPrices = await getPrices();
        initialPrices = allPrices.filter((p: any) => p.sku === initialData?.sku);

        const allInventory = await getInventory() as Record<string, any>;
        const stockEntry = allInventory[(initialData?.sku || '').toUpperCase()];
        initialStock = stockEntry ? [stockEntry] : [];
    }

    return (
        <ConsumableEditorClient
            initialData={initialData}
            categories={categories}
            initialPrices={initialPrices}
            initialStock={initialStock}
        />
    );
}
