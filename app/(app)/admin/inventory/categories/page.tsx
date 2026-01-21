import { getCategories } from '@/app/actions/inventory';
import CategoryHierarchyClient from './hierarchy-client';
import Link from 'next/link';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryListPage({ searchParams }: Props) {
    const params = await searchParams;
    const type = (params.type as any) || 'product';
    const categories = await getCategories(type);

    const typeLabels: Record<string, string> = {
        product: 'Ürün',
        consumable: 'Sarf Malzeme',
        service: 'Hizmet'
    };

    return (
        <div className="p-8 font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{typeLabels[type]} Kategori Yönetimi</h1>
                    <p className="text-gray-500">Bu bölüme özel kategori hiyerarşisini yönetin ve sıralayın.</p>
                </div>
                <Link
                    href={`/admin/inventory/categories/new?type=${type}`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    + Yeni {typeLabels[type]} Kategorisi
                </Link>
            </div>

            {categories.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-500">
                    Henüz kategori eklenmemiş.
                </div>
            ) : (
                <CategoryHierarchyClient categories={categories} />
            )}
        </div>
    );
}
