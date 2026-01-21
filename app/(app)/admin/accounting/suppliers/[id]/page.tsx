import { getContactDetail, getContactOrders, getContactTransactions } from '@/app/actions/accounting';
import ContactDetailClient from '@/app/(app)/admin/accounting/components/contact-detail-client';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const detail = await getContactDetail(id);

    if (!detail || detail.contact.type !== 'supplier') {
        return notFound();
    }

    const orders = await getContactOrders(id);
    const transactions = await getContactTransactions(id);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Link href="/admin/accounting" className="hover:text-emerald-600 transition-colors">Muhasebe</Link>
                    <span>/</span>
                    <Link href="/admin/accounting/suppliers" className="hover:text-emerald-600 transition-colors">Tedarikçiler</Link>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Detay</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tedarikçi Kartı</h1>
            </div>

            <ContactDetailClient
                contact={detail.contact}
                account={detail.account}
                totals={detail.totals}
                orders={orders}
                transactions={transactions}
                type="supplier"
            />
        </div>
    );
}
