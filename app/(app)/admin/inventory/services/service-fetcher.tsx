import { getProducts } from '@/app/actions/inventory';
import ServiceListClient from './list-client';

interface Props {
    params: {
        search?: string;
        categoryId?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    };
}

export default async function ServiceFetcher({ params }: Props) {
    const services = await getProducts({
        type: 'service',
        ...params
    });

    return <ServiceListClient initialData={services} />;
}
