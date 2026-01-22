import { getProducts } from '@/app/actions/inventory';
import ProductListTable from './product-list-table';
import { getAuthenticatedClient } from '@/app/actions/auth-helper';

interface Props {
    params: {
        search?: string;
        categoryId?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    };
    type?: 'product' | 'consumable' | 'service';
}

export default async function ProductFetcher({ params, type = 'product' }: Props) {
    const products = await getProducts({
        type,
        search: params.search,
        categoryId: params.categoryId,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder
    });

    // Fetch stock for these products
    if (products.length > 0) {
        const { supabase, tenant } = await getAuthenticatedClient();
        const skus = products.map(p => p.sku);
        const { data: inventory } = await supabase
            .from('inventory_items')
            .select('sku, state')
            .in('sku', skus)
            .eq('tenant_id', tenant.id);

        // Map stock back to products
        products.forEach(p => {
            const stockItems = inventory?.filter(i => i.sku === p.sku) || [];
            const onHand = stockItems.reduce((acc, curr) => acc + ((curr.state as any)?.on_hand || 0), 0);
            (p as any).stock = onHand;
        });
    }

    return <ProductListTable initialProducts={products} params={params} type={type} />;
}
