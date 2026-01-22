import { getPages } from '@/app/actions/cms';
import { PageListClient } from './page-list-client';

export default async function PagesFetcher() {
    // This component is specifically responsible for the "heavy" data fetch
    const pages = await getPages();
    return <PageListClient initialPages={pages} />;
}
