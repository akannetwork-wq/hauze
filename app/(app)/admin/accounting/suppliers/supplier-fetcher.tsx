import { getContacts } from '@/app/actions/accounting';
import SupplierClient from './supplier-client';

export default async function SupplierFetcher() {
    const suppliers = await getContacts('supplier');

    return (
        <div className="animate-in fade-in duration-700">
            <SupplierClient initialSuppliers={suppliers} />
        </div>
    );
}
