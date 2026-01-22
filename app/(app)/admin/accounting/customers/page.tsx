import { getContacts } from '@/app/actions/accounting';
import CustomerClient from '@/app/(app)/admin/accounting/customers/customer-client';
import Link from 'next/link';
import { headers } from 'next/headers';

export default async function CustomersPage() {
    await headers();
    const customers = await getContacts('customer');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/accounting" className="hover:text-indigo-600 transition-colors">Muhasebe</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Müşteriler</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Müşteri Yönetimi</h1>
                </div>
            </div>

            <CustomerClient initialCustomers={customers} />
        </div>
    );
}
