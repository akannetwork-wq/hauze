import { getProduct, getCategories } from '@/app/actions/inventory';
import { getPrices, getInventory } from '@/app/actions/commerce';
import ProductEditorClient from '@/app/(app)/admin/inventory/products/[id]/editor-client';
import { redirect } from 'next/navigation';
import { Product, Price, InventoryItem } from '@/types';

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isNew = id === 'new';

    let product: Product | null = null;
    let productPrices: Price[] = [];
    let productInventory: InventoryItem[] = [];

    if (!isNew) {
        product = await getProduct(id) as any; // Cast for now as getProduct returns joined data
        if (!product) redirect('/admin/inventory/products');

        // Fetch commerce data separately as they are linked by SKU
        const allPrices = await getPrices();
        const allStock = await getInventory();

        productPrices = allPrices.filter(p => p.sku === product?.sku);

        const stockEntry = (allStock as Record<string, any>)[(product?.sku || '').toUpperCase()];
        productInventory = stockEntry ? [stockEntry] : [];
    }

    const categories = await getCategories('product');

    return (
        <ProductEditorClient
            initialData={product}
            categories={categories}
            initialPrices={productPrices}
            initialStock={productInventory}
        />
    );
}
