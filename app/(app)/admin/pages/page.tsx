
import { getPages } from '@/app/actions/cms';
import { PageListClient } from './page-list-client';
import { Suspense } from 'react';

export default async function PagesIndex() {
    const pages = await getPages();

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Pages</h1>
            </div>

            <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading pages...</div>}>
                <PageListClient initialPages={pages} />
            </Suspense>
        </div>
    );
}
