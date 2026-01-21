
import { getPublicProducts } from '@/app/actions/commerce-public';
import { ProductCard } from './product-card';

export async function ProductGrid({ tenantId }: { tenantId: string }) {
    const products = await getPublicProducts(tenantId);

    if (products.length === 0) {
        return (
            <div className="py-12 text-center text-gray-500">
                Ürün Bilgisi Bulunamadı
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p: any) => (
                <ProductCard key={p.id} product={p} />
            ))}
        </div>
    );
}
