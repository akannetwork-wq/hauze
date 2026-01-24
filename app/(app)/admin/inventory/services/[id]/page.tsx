import { getProduct, getCategories } from '@/app/actions/inventory';
import ServiceEditorClient from '../components/service-editor';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ServiceEditPage({ params }: Props) {
    const { id } = await params;
    const service = await getProduct(id);
    const categories = await getCategories('service');

    if (!service) {
        notFound();
    }

    return (
        <ServiceEditorClient
            initialData={service}
            categories={categories}
        />
    );
}
