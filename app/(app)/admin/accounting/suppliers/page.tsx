import { getContacts } from '@/app/actions/accounting';
import SupplierClient from '@/app/(app)/admin/accounting/suppliers/supplier-client';
import Link from 'next/link';

export default async function SuppliersPage() {
    const suppliers = await getContacts('supplier');

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/admin/accounting" className="hover:text-indigo-600 transition-colors">Muhasebe</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Tedarikçiler</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tedarikçi Yönetimi</h1>
                </div>
            </div>

            <SupplierClient initialSuppliers={suppliers} />
        </div>
    );
}
