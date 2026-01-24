import { getCategories } from '@/app/actions/inventory';
import ServiceEditorClient from '../components/service-editor';

export default async function NewServicePage() {
    const categories = await getCategories('service');

    return (
        <ServiceEditorClient
            initialData={null}
            categories={categories}
        />
    );
}
