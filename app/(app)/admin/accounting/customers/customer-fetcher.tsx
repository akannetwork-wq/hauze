import { getContacts } from '@/app/actions/accounting';
import CustomerClient from './customer-client';

export default async function CustomerFetcher() {
    // Heavy DB Fetch
    const customers = await getContacts('customer');
    return <CustomerClient initialCustomers={customers} />;
}
