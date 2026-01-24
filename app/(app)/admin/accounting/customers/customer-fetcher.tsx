import { getContacts } from '@/app/actions/accounting';
import ContactList from '@/components/admin/contacts/contact-list';

export default async function CustomerFetcher() {
    // Heavy DB Fetch
    const customers = await getContacts('customer');
    return <ContactList initialContacts={customers} type="customer" />;
}
