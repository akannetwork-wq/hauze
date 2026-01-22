import { getCategories } from '@/app/actions/inventory';
import CategoryHierarchyClient from './hierarchy-client';

interface Props {
    type: 'product' | 'consumable' | 'service';
}

export default async function CategoryFetcher({ type }: Props) {
    const categories = await getCategories(type);

    if (categories.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 shadow-sm p-12 text-center text-gray-400 font-medium">
                Henüz kategori eklenmemiş.
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            <CategoryHierarchyClient categories={categories} />
        </div>
    );
}
