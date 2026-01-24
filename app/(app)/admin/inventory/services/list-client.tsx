'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ServiceListTable from './service-list-table';

interface Props {
    initialData: any[];
}

export default function ServiceListClient({ initialData }: Props) {
    const searchParams = useSearchParams();

    // Extract params for infinite scroll / re-fetching
    const params = {
        q: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        status: searchParams.get('status') || '',
        sort: searchParams.get('sort') || 'created_at',
        order: (searchParams.get('order') as 'asc' | 'desc') || 'desc'
    };

    return (
        <div className="space-y-6">
            <ServiceListTable
                initialServices={initialData}
                params={{
                    search: params.q,
                    categoryId: params.category,
                    status: params.status,
                    sortBy: params.sort,
                    sortOrder: params.order
                }}
            />
        </div>
    );
}
