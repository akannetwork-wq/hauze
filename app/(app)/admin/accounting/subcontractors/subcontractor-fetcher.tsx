import { getContacts } from '@/app/actions/accounting';
import ContactList from '@/components/admin/contacts/contact-list';

export default async function SubcontractorFetcher() {
    // Heavy DB Fetch
    const subcontractors = await getContacts('subcontractor');
    return <ContactList initialContacts={subcontractors} type="subcontractor" />;
}
